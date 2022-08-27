
let block_vertex =`#version 300 es
    layout(location = 0)in vec3 a_position;
    layout(location = 1)in vec2 a_uv;

    out vec2 v_uv;
	out vec3 v_world_position;
	out vec3 v_face_normal;

    uniform mat4 u_model_mat;
    uniform mat4 u_vp_mat;
	uniform vec3 u_face_normal;

    void main() {
		v_face_normal = (u_model_mat * vec4(u_face_normal, 0.0)).xyz;
        v_uv = a_uv;
		v_world_position = (u_model_mat * vec4(a_position, 1.0)).xyz;
        gl_Position = u_vp_mat * vec4(v_world_position, 1.0);
    }`;


let block_fragment = `#version 300 es
precision highp float;

uniform vec3 u_camera_pos;

uniform sampler2D u_texture;
uniform sampler2D u_normal_tex;
uniform sampler2D u_met_rough_tex;

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
out vec4 frag_color;

const float PI =  3.14159265359;

// DataStruct ===========
struct sFragData {
	// Material
	float roughness;
	float alpha;
	float metalness;
	vec3 f0;
    float height;

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
mat3 cotangent_frame(vec3 N, vec3 p, vec2 uv){
	// get edge vectors of the pixel triangle
	vec3 dp1 = dFdx( p );
	vec3 dp2 = dFdy( p );
	vec2 duv1 = dFdx( uv );
	vec2 duv2 = dFdy( uv );

	// solve the linear system
	vec3 dp2perp = cross( N,dp2);
	vec3 dp1perp = cross( dp1, N );
	vec3 T = dp2perp * duv1.x + dp1perp * duv2.x;
	vec3 B = dp2perp * duv1.y + dp1perp * duv2.y;

	// construct a scale-invariant frame
	float invmax = inversesqrt( max( dot(T,T), dot(B,B) ) );
	return mat3( T * invmax, B * invmax, N );
}

vec3 perturbNormal( vec3 N, vec3 V, vec2 texcoord, vec3 normal_pixel ) {
	normal_pixel = normal_pixel * 255./127. - 128./127.;
	mat3 TBN = cotangent_frame(N, V, texcoord);
	return normalize(TBN * normal_pixel);
}
sFragVects getVectsOfFragment(const in sFragData mat, const in vec3 light_pos) {
	sFragVects vects;

	vects.l = normalize(light_pos - mat.world_pos);

	vec3 v = normalize(u_camera_pos - mat.world_pos);
	vec3 half_v = normalize(v + vects.l);

	vects.r = reflect(v, normalize(mat.normal));

	vects.l_dot_h = clamp(dot(half_v, vects.l), 0.0001, 1.0);

	vects.n_dot_v = clamp(dot(mat.normal, v), 0.0001, 1.0);
	vects.n_dot_h = clamp(dot(mat.normal, half_v), 0.0001, 1.0);
	vects.n_dot_l = clamp(dot(mat.normal, vects.l), 0.0001, 1.0);

	return vects;
}

vec2 get_tiling_uv(vec2 uv, vec2 uv_size) {
	float t = u_time;
	vec2 t_uv = (uv / uv_size) + (vec2(0.0, mod(t, uv_size.y)) / uv_size);
	return t_uv;
	//return (uv / uv_size) + (vec2(mod((u_time / 1000.0), uv_size.s), mod((u_time / 1000.0), uv_size.t))  * 1.0 / uv_size);
}

sFragData getDataOfFragment(const in vec2 uv) {
	sFragData mat;

	vec2 specular_uv = uv / u_specular_anim_size + (vec2(u_time / 10000.0) / u_specular_anim_size);
	vec4 mrt = texture(u_met_rough_tex, get_tiling_uv(uv, u_specular_anim_size));
	mat.roughness = (1.0- mrt.r);
    //mat.roughness = mat.roughness * mat.roughness;
	mat.metalness = mrt.g;

	mat.albedo = texture(u_texture, get_tiling_uv(uv, u_albedo_anim_size)).rgb;
    //mat.albedo = de_gamma(u_color.rgb * texture(u_texture, uv).rgb);

	vec2 normal_uv = uv / u_normal_anim_size;
	vec4 N = texture( u_normal_tex, get_tiling_uv(uv, u_normal_anim_size));
	mat.normal = normalize((2.0 * N.rgb) - 1.0);
	mat.normal = normalize(perturbNormal(normalize(v_face_normal), normalize( - v_world_position), v_uv, N.rgb));
    mat.height = N.a;

	//mat.emmisive =  de_gamma(texture( u_emmisive_tex, v_uv ).rgb) * u_emmisive_factor;
	//mat.occlusion = min(texture( u_occlusion_tex, v_uv ).r, texture(u_ambient_occlusion_tex, v_uv).r);

	mat.world_pos = v_world_position;

	mat.f0 = mix(vec3(0.03), mat.albedo, mat.metalness);
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

vec3 specular_BRDF(const in sFragData data, const in sFragVects vectors) {
	float D = distribution_GGX(data, vectors);

	vec3 F = fresnel_schlick(vectors.n_dot_h, data.f0, data.roughness);

	float G = geometry_Smith(data, vectors);

	float normalization = (4.0 * vectors.n_dot_l * vectors.n_dot_v) + 0.001;

	return vec3(D * F * G) / normalization;
}


// PBR ========= =========
vec3 get_pbr_color(const in sFragData data, const in sFragVects vects) {
	vec3 diffuse_color = mix(data.albedo, vec3(0.0), data.metalness);

	vec3 specular = specular_BRDF(data, vects);
	vec3 diffuse = diffuse_color / PI; // Lambertian BRDF cuz cheap

	return ((specular + diffuse));
}

// POM ========================
float get_height(vec2 uv_coords) {
	return 1.0 - (texture(u_normal_tex, uv_coords).a * 2.0 - 1.0);
}

/**
* Iterate through the heighmap with the direction of the tangential view vector
* NOTE: There is some artifacts on some extrems parts that a simple smoothing could not solve
*       But increasing the resolution of the POM effect makes it a bit better
*/

const float POM_resolution = 64.0;
const float POM_depth = 0.090;
vec2 get_POM_coords(vec2 base_coords, vec3 view_vector) {
    float map_depth = get_height(base_coords);
    float layer_depth = 0.0;
    float prev_layer_depth = 0.0;
    // Step depth size
    float layer_step = 1.0 / POM_resolution;
    // Starting point
    vec2 it_coords = base_coords;
    vec2 prev_coords = vec2(0);
    // Direction for the layer look up
    vec2 step_vector = ((-view_vector.xy) * POM_depth) / POM_resolution;

    // Early stop
    if (map_depth == 0.0) {
        return it_coords;
    }

    // Traverse the layers until you find that you went too low
    for(; layer_depth < 1.0 && map_depth > layer_depth; layer_depth += layer_step) {
        prev_coords = it_coords;
        it_coords += step_vector;
        map_depth = get_height(it_coords);
    }

    // Smooth between the current and previus layer's depths based on the actual depth
    return mix(it_coords, prev_coords, (layer_depth - map_depth) / layer_step );
}

void main() {
	vec3 view = normalize(u_camera_pos - v_world_position);
	mat3 inv_TBN = transpose(cotangent_frame(normalize(v_face_normal), view, v_uv));
    vec3 tangent_view = inv_TBN * view;
	vec2 pom_uv = get_POM_coords(v_uv, tangent_view);
    sFragData frag_data = getDataOfFragment(pom_uv);

    if (u_render_mode == 0.0) {
      sFragVects light_vects = getVectsOfFragment(frag_data, u_light_pos);

 	  vec3 light_component = light_vects.n_dot_l * vec3(1.0) * 10.0;

      frag_color = vec4(get_pbr_color(frag_data, light_vects) * light_component, 1.0);
    }
}
`;

export {block_vertex, block_fragment};
