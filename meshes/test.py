from pygltflib import GLTF2
import numpy
import struct
gltf = GLTF2().load("box.gltf")

# get the first mesh in the current scene (in this example there is only one scene and one mesh)
mesh = gltf.meshes[gltf.scenes[gltf.scene].nodes[0]]

# get the vertices for each primitive in the mesh (in this example there is only one)
for primitive in mesh.primitives:

    # get the binary data for this mesh primitive from the buffer
    accessor = gltf.accessors[primitive.attributes.POSITION]
    bufferView = gltf.bufferViews[accessor.bufferView]
    buffer = gltf.buffers[bufferView.buffer]
    data = gltf.get_data_from_buffer_uri(buffer.uri)

    print('VERTICES: ####')
    # pull each vertex from the binary buffer and convert it into a tuple of python floats
    vertices = []
    for i in range(accessor.count):
        index = bufferView.byteOffset + accessor.byteOffset + i*12  # the location in the buffer of this vertex
        d = data[index:index+12]  # the vertex data
        v = struct.unpack("<fff", d)   # convert from base64 to three floats
        vertices.append(v)
        print(i, v)

    print('TANGENT: ####')
    accessor = gltf.accessors[primitive.attributes.TANGENT]
    bufferView = gltf.bufferViews[accessor.bufferView]
    buffer = gltf.buffers[bufferView.buffer]
    data = gltf.get_data_from_buffer_uri(buffer.uri)

    # pull each vertex from the binary buffer and convert it into a tuple of python floats
    tans = []
    for i in range(accessor.count):
        index = bufferView.byteOffset + accessor.byteOffset + i*12  # the location in the buffer of this vertex
        d = data[index:index+12]  # the vertex data
        v = struct.unpack("<fff", d)   # convert from base64 to three floats
        tans.append(v)
        print(i, v)

    print('NORMALS: ####')
    accessor = gltf.accessors[primitive.attributes.NORMAL]
    bufferView = gltf.bufferViews[accessor.bufferView]
    buffer = gltf.buffers[bufferView.buffer]
    data = gltf.get_data_from_buffer_uri(buffer.uri)

    # pull each vertex from the binary buffer and convert it into a tuple of python floats
    normals = []
    for i in range(accessor.count):
        index = bufferView.byteOffset + accessor.byteOffset + i*12  # the location in the buffer of this vertex
        d = data[index:index+12]  # the vertex data
        v = struct.unpack("<fff", d)   # convert from base64 to three floats
        normals.append(v)
        print(i, v)

    print('UVs: ####')
    accessor = gltf.accessors[primitive.attributes.TEXCOORD_0]
    bufferView = gltf.bufferViews[accessor.bufferView]
    buffer = gltf.buffers[bufferView.buffer]
    data = gltf.get_data_from_buffer_uri(buffer.uri)

    # pull each vertex from the binary buffer and convert it into a tuple of python floats
    uvs = []
    for i in range(accessor.count):
        index = bufferView.byteOffset + accessor.byteOffset + i*8  # the location in the buffer of this vertex
        d = data[index:index+8]  # the vertex data
        v = struct.unpack("<ff", d)   # convert from base64 to three floats
        uvs.append(v)
        print(i, v)

    print('INDEX: ####')
    accessor = gltf.accessors[primitive.indices]
    bufferView = gltf.bufferViews[accessor.bufferView]
    buffer = gltf.buffers[bufferView.buffer]
    data = gltf.get_data_from_buffer_uri(buffer.uri)

    # pull each vertex from the binary buffer and convert it into a tuple of python floats
    indexs = []
    for i in range(accessor.count):
        index = bufferView.byteOffset + accessor.byteOffset + i*2  # the location in the buffer of this vertex
        d = data[index:index+2]  # the vertex data
        v = struct.unpack("<H", d)   # convert from base64 to three floats
        indexs.append(v[0])
        print(i, v)

for i in indexs:
    v = vertices[i]
    t = tans[i]
    n = normals[i]
    uv = uvs[i]

    raw_vert = [v[0], v[1], v[2], n[0], n[1], n[2], t[0], t[1], t[2], uv[0], uv[1]]
    raw_vert = [str(x) for x in raw_vert]
    print(', '.join(raw_vert), ',')

print([x for x in range(len(indexs))])