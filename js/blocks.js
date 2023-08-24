
/**
 * ABOUT BLOCKS
 * TYPE 1:
 * Only one side:
 * {type: 1, side: {...}}
 * TYPE 2:
 * Different top and bottom, but same shades
 *
 * */

let blocks = [
  {
    type: 2,
    name: "respawn_anchor",
    top: {
      albedo: { dir:"/img/blocks/respawn_anchor/respawn_anchor_top.png", size: [1,10] },
      normal: { dir:"/img/blocks/respawn_anchor/respawn_anchor_top_n.png", size: [1,10] },
      specular: { dir:"/img/blocks/respawn_anchor/respawn_anchor_top_s.png", size: [1,1] }
    },
    bottom: {
      albedo: { dir:"/img/blocks/respawn_anchor/respawn_anchor_bottom.png", size: [1,1] },
      normal: { dir:"/img/blocks/respawn_anchor/respawn_anchor_bottom_n.png", size: [1,1] },
      specular: { dir:"/img/blocks/respawn_anchor/respawn_anchor_bottom_s.png", size: [1,1] }
    },
    side: {
      albedo: { dir:"/img/blocks/respawn_anchor/respawn_anchor_side2.png", size: [1,1] },
      normal: { dir:"/img/blocks/respawn_anchor/respawn_anchor_side2_n.png", size: [1,1] },
      specular: { dir:"/img/blocks/respawn_anchor/respawn_anchor_side2_s.png", size: [1,1] }
    }
  },
  {
    type: 2,
    name: "stone_diamond_ore",
    top: {
      albedo: { dir:"/img/blocks/stone_diamond_ore/0.png", size: [1,1] },
      normal: { dir:"/img/blocks/stone_diamond_ore/0_n.png", size: [1,1] },
      specular: { dir:"/img/blocks/stone_diamond_ore/0_s.png", size: [1,1] }
    },
    bottom: {
      albedo: { dir:"/img/blocks/stone_diamond_ore/1.png", size: [1,1] },
      normal: { dir:"/img/blocks/stone_diamond_ore/1_n.png", size: [1,1] },
      specular: { dir:"/img/blocks/stone_diamond_ore/1_s.png", size: [1,1] }
    },
    side: {
      albedo: { dir:"/img/blocks/stone_diamond_ore/16.png", size: [1,1] },
      normal: { dir:"/img/blocks/stone_diamond_ore/16_n.png", size: [1,1] },
      specular: { dir:"/img/blocks/stone_diamond_ore/16_s.png", size: [1,1] }
    }
  },
  {
    type: 2,
    name: "tnt",
    top: {
      albedo: { dir:"/img/blocks/tnt/tnt_top.png", size: [1,1] },
      normal: { dir:"/img/blocks/tnt/tnt_top_n.png", size: [1,1] },
      specular: { dir:"/img/blocks/tnt/tnt_top_s.png", size: [1,1] }
    },
    side: {
      albedo: { dir:"/img/blocks/tnt/tnt_side.png", size: [1,1] },
      normal: { dir:"/img/blocks/tnt/tnt_side_n.png", size: [1,1] },
      specular: { dir:"/img/blocks/tnt/tnt_side_s.png", size: [1,1] }
    },
    bottom: {
      albedo: { dir:"/img/blocks/tnt/tnt_bottom.png", size: [1,1] },
      normal: { dir:"/img/blocks/tnt/tnt_bottom_n.png", size: [1,1] },
      specular: { dir:"/img/blocks/tnt/tnt_bottom_s.png", size: [1,1] }
    },
  }
];

export {blocks};
