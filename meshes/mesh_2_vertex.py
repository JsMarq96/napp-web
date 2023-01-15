import numpy as np

vertices = []
normals = []
uvs = []

tans = []

indexing_compilation = []

with open('steve.obj', 'r') as obj_file:
    for line in obj_file:
        line_parts = line.split(' ', 1)
        if 'v ' in line:
            # Vertex line_parts 
            vert = line_parts[1].replace(' ', ' ,').replace('\n', '').split(' ,')
            vertices.append(np.asarray([float(x) for x in vert]))
            tans.append(np.asarray([0.0, 0.0, 0.0]))
        elif 'vt ' in line:
            # UVs
            uv = line_parts[1].replace(' ', ' ,').replace('\n', '').split(' ,')
            uvs.append(np.asarray([float(x) for x in uv]))
        elif 'vn ' in line:
            # Normals
            norm = line_parts[1].replace(' ', ' ,').replace('\n', '').split(' ,')
            normals.append(np.asarray([float(x) for x in norm]))
        elif 'f ' in line:
            raw_face = line_parts[1].split(' ')

            vertex_indices = [0,0,0]
            uvs_indices = [0,0,0]
            normals_indices = [0,0,0]
            vertex_i = 0

            for vertex in raw_face:
                indices = vertex.split('/')
                vertex_indices[vertex_i] = int(indices[0]) - 1
                uvs_indices[vertex_i] = int(indices[1]) - 1
                normals_indices[vertex_i] = int(indices[2]) - 1
                vertex_i = vertex_i + 1

            indexing_compilation.append({'vertex' : vertex_indices, 'uvs' : uvs_indices, 'normals' : normals_indices})
            
            v1 = vertices[vertex_indices[0]]
            v2 = vertices[vertex_indices[1]]
            v3 = vertices[vertex_indices[2]]
            uv1 = uvs[uvs_indices[0]]
            uv2 = uvs[uvs_indices[1]]
            uv3 = uvs[uvs_indices[2]]

            x1 = v2[0] - v1[0]
            x2 = v3[0] - v1[0]
            y1 = v2[1] - v1[1]
            y2 = v3[1] - v1[1]
            z1 = v2[2] - v1[2]
            z2 = v3[2] - v1[2]

            s1 = uv2[0] - uv1[0]
            s2 = uv3[0] - uv1[0]
            t1 = uv2[1] - uv1[1]
            t2 = uv3[1] - uv1[1]

            r = 1.0 / (s1 * t2 - s2 * t1)
            s_dir = np.asarray([(t2 * x1 - t1 * x2) * r, (t2 * y1 - t1 * y2) * r, (t2 * z1 - t1 * z2) * r])

            tans[vertex_indices[0]] += s_dir
            tans[vertex_indices[1]] += s_dir
            tans[vertex_indices[2]] += s_dir

            #print(vertex_i, vertex_indices, normals_indices)
            #print("// Face === ")

for index in indexing_compilation:
    n_i = index['normals']
    v_i = index['vertex']
    uv_i = index['uvs']
    for i in range(3):
        v = vertices[v_i[i]]
        n = normals[n_i[i]]
        uv = uvs[uv_i[i]]
        t = tans[v_i[i]]
        tans[v_i[i]] = (t - n * np.dot(n, t))
        tans[v_i[i]] = tans[v_i[i]] / (np.linalg.norm(tans[v_i[i]]) + 1e-16)

print(tans, indexing_compilation)