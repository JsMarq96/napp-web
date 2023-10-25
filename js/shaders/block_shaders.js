
let block_vertex =`#version 300 es
    layout(location = 0)in vec3 a_position;
    layout(location = 1)in vec2 a_uv;
	layout(location = 2)in vec3 a_normal;
	layout(location = 3)in vec3 a_tangent;
	layout(location = 4)in vec3 a_binormal;

    out vec2 v_uv;
	out vec3 v_world_position;
	out vec3 v_tangent_view;
	out vec3 v_face_normal;
	out mat3 v_TBN;

    uniform mat4 u_model_mat;
    uniform mat4 u_vp_mat;
	uniform vec3 u_camera_pos;

    void main() {
    	// Compute the TBN
		vec3 normal = normalize(u_model_mat * vec4(a_normal, 0.0)).xyz;
        vec3 tangent = normalize(u_model_mat * vec4(a_tangent, 0.0)).xyz;
        vec3 binormal = normalize(u_model_mat * vec4(a_binormal, 0.0)).xyz;
        //tangent = normalize(tangent - (dot(normal, tangent) * normal));

		v_face_normal = normal;
		
		v_TBN = (mat3(tangent, binormal, normal));

		v_uv = a_uv;
		v_world_position = (u_model_mat * vec4(a_position, 1.0)).xyz;
        gl_Position = u_vp_mat * vec4(v_world_position, 1.0);

        vec3 view = normalize(u_camera_pos - v_world_position);
		mat3 inv_TBN = transpose(v_TBN);
    	v_tangent_view = inv_TBN * view;
    }`;


let block_fragment = `#version 300 es
precision highp float;

uniform vec3 u_camera_pos;

uniform sampler2D u_texture;
uniform sampler2D u_normal_tex;
uniform sampler2D u_met_rough_tex;
uniform samplerCube u_enviorment_map;
uniform sampler2D u_brdf_LUT;

uniform vec3 u_light_pos;

// Animation
uniform float u_time;
uniform vec2 u_albedo_anim_size;
uniform vec2 u_normal_anim_size;
uniform vec2 u_specular_anim_size;
uniform float u_render_mode;

in vec3 v_face_normal;
in vec2 v_uv;
in vec3 v_world_position;
in mat3 v_TBN;
in vec3 v_tangent_view;
out vec4 frag_color;

const float PI =  3.14159265359;

// DataStruct ===========
struct sFragData {
	// Material
	float roughness;
	float alpha;
	float metalness;
	vec3 f0;
	float f90;
    float height;
	float reflectance;

	vec3 albedo;
	vec3 emmisive;

	float occlusion;

	vec3 normal;

	// Position
	vec3 world_pos;

	float depth;

	vec2 uv;
};

struct sFragVects {
	vec3 r;
	vec3 l;
	float n_dot_v;
	float n_dot_h;
	float n_dot_l;
	float l_dot_d;
	float l_dot_h;
	float v_dot_h;
	float attenuation;
};

// Fill Datastructs =============
vec3 perturbNormal( vec3 N, vec3 V, vec2 texcoord, vec3 normal_pixel ) {
	normal_pixel = normal_pixel * 255./127. - 128./127.;
	return normalize(v_TBN * normal_pixel);
}

sFragVects getVectsOfFragment(const in sFragData mat, const in vec3 light_pos) {
	sFragVects vects;

	vects.l = normalize(light_pos - mat.world_pos);

	vec3 v = normalize(u_camera_pos - mat.world_pos);
	vec3 half_v = normalize(v + vects.l);

	vects.r = reflect(-v, normalize(mat.normal));

	vects.l_dot_h = clamp(dot(half_v, vects.l), 0.0001, 1.0);

	vects.n_dot_v = clamp(dot(mat.normal, v), 0.0001, 1.0);
	vects.n_dot_h = clamp(dot(mat.normal, half_v), 0.0001, 1.0);
	vects.n_dot_l = clamp(dot(mat.normal, vects.l), 0.0001, 1.0);

	return vects;
}

vec2 get_tiling_uv(vec2 uv, vec2 uv_size) {
	float t = u_time * 7.0;
	vec2 t_uv = (uv / uv_size) + (vec2(0.0, mod(t, uv_size.y)) / uv_size);
	return t_uv;
}

const float GAMMA = 2.2;
const float INV_GAMMA = 1.0 / GAMMA;

vec3 gamma_to_linear(vec3 color) {
	return pow(color, vec3(GAMMA));
}

vec3 linear_to_gamma(vec3 color) {
	return pow(color, vec3(INV_GAMMA));
}

sFragData getDataOfFragment(const in vec2 uv) {
	sFragData mat;

	vec4 mrt = texture(u_met_rough_tex, get_tiling_uv(uv, u_specular_anim_size));
	mat.roughness = (1.0 - mrt.r);
	mat.roughness = sqrt(mat.roughness); // Perceptual
	mat.metalness = mrt.g;

	mat.albedo = linear_to_gamma(texture(u_texture, get_tiling_uv(uv, u_albedo_anim_size)).rgb);

	//mat.f0 = mix(vec3(0.03), mat.albedo, mat.metalness);

	vec4 N = texture( u_normal_tex, get_tiling_uv(uv, u_normal_anim_size));
	mat.normal = normalize((2.0 * N.rgb) - 1.0);
	mat.normal = normalize(perturbNormal(normalize(v_face_normal), normalize( - v_world_position), v_uv, N.rgb));
    mat.height = N.a;

	mat.emmisive = mat.albedo * mrt.b;

	// Bootleg reflectance

	//float reflectance_dieletectric = mix(0.4, 0.9, mat.roughness);
	//float reflectance = mix(reflectance_dieletectric, 1.0, mat.metalness);
	//mat.f0 = 0.16 * reflectance * reflectance * (1.0 - mat.metalness) + mat.albedo * mat.metalness;
	//mat.f0 = mix(vec3(0.03), mat.albedo, mat.metalness);
	
	if (mat.metalness > 0.5) {
		// Metallic material
		mat.reflectance = 0.750;
		mat.f0 = mat.albedo * mat.metalness;
	} else {
		mat.reflectance = 0.5;
		mat.f0 = vec3(0.16) * mat.reflectance * mat.reflectance;
		mat.f0 = mix(vec3(0.03), mat.albedo, mat.metalness);
	}

	mat.albedo = (1.0 - mat.metalness) * mat.albedo;

	mat.world_pos = v_world_position;

	mat.alpha = mat.roughness * mat.roughness;

	mat.uv = uv;

	return mat;
}

// BRDF ==================
float distribution_GGX(const in sFragData data, const in sFragVects vectors) {
	float alpha_squared = data.alpha * data.alpha;

	float f = ((vectors.n_dot_h * vectors.n_dot_h) * (alpha_squared - 1.0)) + 1.0;
	return alpha_squared / ((PI * f * f));
}

// TODO: add the grazing at 90 degrees
vec3 fresnel_schlick(const in float angle, const in vec3 f0, const in float roughness) {
	float f = pow(1.0 - angle, 5.0);
	return f0 + (vec3(1.0 - roughness) - f0) * f;
}

float GGX(const in float n_dot_v, const in float k) {
	return n_dot_v / (n_dot_v * (1.0 - k) + k);
}

float geometry_Smith(const in sFragData data, const in sFragVects vectors) {
	float k = pow(data.roughness + 1.0, 2.0) / 8.0;
	return GGX(vectors.n_dot_l, k) * GGX(vectors.n_dot_v, k);
}

float Fd_Lambert() {
	return 1.0 / PI;
}

vec3 specular_BRDF(const in sFragData data, const in sFragVects vectors) {
	float D = distribution_GGX(data, vectors);

	vec3 F = fresnel_schlick(vectors.n_dot_h, data.f0, data.roughness);

	float G = geometry_Smith(data, vectors);

	float normalization = (4.0 * vectors.n_dot_l * vectors.n_dot_v) + 0.001;

	return vec3(D * F * G) / normalization;
}

vec3 get_reflection_color(in vec3 vector, float roughness) {
   // Note, withour PREMS, dirty aprox
   float lod = 0.0 + roughness * 4.0;

   return mix(linear_to_gamma(texture(u_enviorment_map, vector, max(lod - 1.0, 0.0)).rgb), linear_to_gamma(texture(u_enviorment_map, vector, lod).rgb), roughness);
}


// IBL ====================
// Precomputed spherical harmonics at two bands
// Validator: https://www.shadertoy.com/view/XsXyDl
vec3 irradiance_spherical_harmonics(in vec3 n) {
	return vec3(2.58676, 2.730808, 3.152812)
	+ vec3(-0.431493, -0.665128, -0.969124) * (n.y)
	+ vec3(-0.353886, 0.048348, 0.672755) * (n.z)
	+ vec3(-0.604269, -0.88623, -1.298684) * (n.x)
	+ vec3(0.320121, 0.422942, 0.541783) * (n.y * n.x)
	+ vec3(-0.137435, -0.168666,-0.229637) * (n.y * n.z)
	+ vec3(-0.052101, -0.149999, -0.232127) * (3.0 * n.z * n.z - 1.0)
	+ vec3(-0.117312, -0.167151, -0.265015) * (n.z * n.x)
	+ vec3(-0.090028, -0.021071, 0.08956) * (n.x * n.x - n.y * n.y);
}

//https://google.github.io/filament/Filament.html#lighting/imagebasedlights/ibltypes
vec3 get_IBL_contribution(const in sFragData data, const in sFragVects vects) {
	// 1024 has 10 mip-levels, avoid going too high
	float mip_level = 10.0 * (data.roughness) + 0.0;
	vec3 reflect = vects.r;
	vec3 specular_indirect = linear_to_gamma(texture(u_enviorment_map, vec3(reflect.x, reflect.y, reflect.z), mip_level).rgb);

	vec2 LUT_brdf = texture(u_brdf_LUT, vec2(vects.n_dot_v, data.roughness), 0.0).rg;
	// f90 aproximation from Filament
	float f90 = clamp(dot(data.f0, vec3(50.0 * 0.33)), 0.0, 1.0);
    vec3 specular_color = ((data.f0 * LUT_brdf.x) + f90 * LUT_brdf.y);

	vec3 IBL_direction = vec3(-data.normal.x, data.normal.y, data.normal.z);
	//vec3 IBL_direction = normalize((IBL_rotation * vec4(data.normal, 0.0)).xyz);

	vec3 diffuse_IBL = max(linear_to_gamma(irradiance_spherical_harmonics(IBL_direction)) * Fd_Lambert(), 0.0);
	// Add a bit of uniform ambient lightning
	//diffuse_IBL += vec3(0.20, 0.15, 0.15) * 0.5;

	//return diffuse_IBL;
	return specular_indirect * specular_color;
	return data.albedo * diffuse_IBL + specular_indirect * specular_color;
	//return ( mix(data.albedo, vec3(0.1), data.metalness) *  diffuse_IBL ) + specular_IBL * specular_IBL;
}

// ACES TONEMAPPER ===================
// https://github.com/dmnsgn/glsl-tone-map/blob/main/aces.glsl
vec3 aces(vec3 x) {
	const float a = 2.51;
	const float b = 0.03;
	const float c = 2.43;
	const float d = 0.59;
	const float e = 0.14;
	return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
  }

// PBR ===================
vec3 get_pbr_color(const in sFragData data, const in sFragVects vects) {
	vec3 IBL_contribution = get_IBL_contribution(data, vects);
	
	return IBL_contribution + data.emmisive;
}

// POM ========================
float get_height(vec2 uv_coords) {
	return 1.0 - (texture(u_normal_tex, get_tiling_uv(uv_coords, u_normal_anim_size)).a * 2.0 - 1.0);
}

// Dithering function for POM
// https://www.shadertoy.com/view/4tXGWN
float IGN(vec2 p) {
    vec3 magic = vec3(0.06711056, 0.00583715, 52.9829189);
    return fract( magic.z * fract(dot(p,magic.xy)) );
}

/**
* Iterate through the heighmap with the direction of the tangential view vector
* NOTE: There is some artifacts on some extrems parts that a simple smoothing could not solve
*       But increasing the resolution of the POM effect makes it a bit better
*/

const float POM_depth = 0.150;
const float POM_min_res = 16.0;
// NOTE: adjusting the POM resolution dynamically seems to crash webgl accros the browser
// For the aliasing implemente multisampling a-la MSAA x4
vec2 get_POM_coords(vec2 base_coords, vec3 view_vector, float POM_resolution) {
    float map_depth = get_height(base_coords);
    // Step depth size
    //float layer_step = 1.0 / POM_resolution;
	float layer_step = 1.0 / clamp(mix(POM_resolution, POM_min_res, abs(dot(v_face_normal, normalize(u_camera_pos - v_world_position)))), POM_min_res, POM_resolution);
    
	// Direction for the layer look up
    vec2 step_vector = ((-view_vector.xy) * POM_depth) * layer_step;

    // Early stop
    if (map_depth == 0.0) {
        return base_coords;
    }

	vec2 it_coords = base_coords + step_vector;
	float layer_depth = 0.0;
    float prev_layer_depth = 0.0;
	// Traverse the layers until you find that you went too low
	for(; layer_depth < 1.0 && map_depth > layer_depth; layer_depth += layer_step) {
		it_coords += step_vector;
		map_depth = get_height(it_coords);
	}

	vec2 prev_coords = it_coords - step_vector;
	float after_depth = map_depth - layer_depth;
	float before_depth = get_height(prev_coords) - layer_depth + layer_step;

	// Interpolation of the texture coords
	float w = after_depth / (after_depth - before_depth);
	return prev_coords * w + it_coords * (1.0 - w);
}

void main() {
	vec2 pom_uv = get_POM_coords(v_uv, vec3(v_tangent_view.x, -v_tangent_view.y, v_tangent_view.z), 64.0);

    if (u_render_mode == 0.0) {
      sFragData frag_data = getDataOfFragment(pom_uv);
      sFragVects light_vects = getVectsOfFragment(frag_data, u_light_pos);

	   frag_color = vec4(gamma_to_linear(aces(get_pbr_color(frag_data, light_vects))), 1.0);
     } else if (u_render_mode == 1.0) {
       frag_color = vec4(texture(u_normal_tex, get_tiling_uv(pom_uv, u_normal_anim_size)).rgb, 1.0);
     }  else if (u_render_mode == 2.0) {
       frag_color = vec4(texture(u_met_rough_tex, get_tiling_uv(pom_uv, u_specular_anim_size)).rgb, 1.0);
     }

     //rag_color = vec4(get_reflection_color(reflect(view, v_face_normal), 0.5), 1.0);
     //frag_color = vec4(texture(u_brdf_LUT, v_uv).rgb, 1.0);
}
`;


let skybox_fragment =`#version 300 es
precision highp float;
uniform vec3 u_camera_pos;
uniform samplerCube u_texture;
in vec3 v_world_position;
out vec4 frag_color;
void main() {
   vec3 V = normalize(v_world_position - u_camera_pos);
   frag_color = vec4(texture(u_texture, V, 4.0).rgb, 1.0);
   //frag_color = vec4(1.0, 1.0, 0.0, 1.0);
}
`;

export {block_vertex, block_fragment, skybox_fragment};
