

vertices = []
uvs = []

with open('steve.obj', 'r') as obj_file:
    for line in obj_file:
        line_parts = line.split(' ', 1)
        if 'v ' in line:
            # Vertex line_parts 
            vertices.append(line_parts[1].replace(' ', ', ').replace('\n', ''))
        elif 'vt ' in line:
            # UVs
            uvs.append(line_parts[1].replace(' ', ' ,').replace('\n', ''))
        elif 'f ' in line:
            raw_face = line_parts[1].split(' ')

            for vertex in raw_face:
                indices = vertex.split('/')
                print(vertices[int(indices[0]) - 1] + ',    ' + uvs[int(indices[1]) - 1] + ', ')
            print("// Face === ")
