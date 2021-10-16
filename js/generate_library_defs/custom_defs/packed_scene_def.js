"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackedSceneDef = void 0;
exports.PackedSceneDef = `
declare class PackedScene<T> extends Resource {

  
  /** A simplified interface to a scene file. Provides access to operations and checks that can be performed on the scene resource itself.
      Can be used to save a node to a file. When saving, the node as well as all the node it owns get saved (see [code]owner[/code] property on [Node]).
      [b]Note:[/b] The node doesn't need to own itself.
      [b]Example of loading a saved scene:[/b]
      [codeblock]
      # Use \`load()\` instead of \`preload()\` if the path isn't known at compile-time.
      var scene = preload("res://scene.tscn").instance()
      # Add the node as a child of the node the script is attached to.
      add_child(scene)
      [/codeblock]
      [b]Example of saving a node with different owners:[/b] The following example creates 3 objects: [code]Node2D[/code] ([code]node[/code]), [code]RigidBody2D[/code] ([code]rigid[/code]) and [code]CollisionObject2D[/code] ([code]collision[/code]). [code]collision[/code] is a child of [code]rigid[/code] which is a child of [code]node[/code]. Only [code]rigid[/code] is owned by [code]node[/code] and [code]pack[/code] will therefore only save those two nodes, but not [code]collision[/code].
      [codeblock]
      # Create the objects.
      var node = Node2D.new()
      var rigid = RigidBody2D.new()
      var collision = CollisionShape2D.new()
  
      # Create the object hierarchy.
      rigid.add_child(collision)
      node.add_child(rigid)
  
      # Change owner of \`rigid\`, but not of \`collision\`.
      rigid.owner = node
  
      var scene = PackedScene.new()
      # Only \`node\` and \`rigid\` are now packed.
      var result = scene.pack(node)
      if result == OK:
          var error = ResourceSaver.save("res://path/name.scn", scene)  # Or "user://..."
          if error != OK:
              push_error("An error occurred while saving the scene to disk.")
      [/codeblock] */
    "new"(): PackedScene<T>
  
  
  
  
  
  /** A dictionary representation of the scene contents.
        Available keys include "rnames" and "variants" for resources, "node_count", "nodes", "node_paths" for nodes, "editable_instances" for base scene children overrides, "conn_count" and "conns" for signal connections, and "version" for the format style of the PackedScene. */
  _bundled: Dictionary<any, any>;
  
  
  
  /** Returns [code]true[/code] if the scene file has nodes. */
  can_instance(): boolean;
  
  /** Returns the [code]SceneState[/code] representing the scene file contents. */
  get_state(): SceneState;
  
  /** Instantiates the scene's node hierarchy. Triggers child scene instantiation(s). Triggers a [constant Node.NOTIFICATION_INSTANCED] notification on the root node. */
  instance(edit_state?: number): T;
  
  /** Pack will ignore any sub-nodes not owned by given node. See [member Node.owner]. */
  pack(path: Node): number;
  
  
  
  /** If passed to [method instance], blocks edits to the scene state. */
  static GEN_EDIT_STATE_DISABLED: 0;
  
  /** If passed to [method instance], provides local scene resources to the local scene.
        [b]Note:[/b] Only available in editor builds. */
  static GEN_EDIT_STATE_INSTANCE: 1;
  
  /** If passed to [method instance], provides local scene resources to the local scene. Only the main scene should receive the main edit state.
        [b]Note:[/b] Only available in editor builds. */
  static GEN_EDIT_STATE_MAIN: 2;
  
  }
`;
//# sourceMappingURL=packed_scene_def.js.map