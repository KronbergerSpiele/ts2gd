
/**
 * Kinematic bodies are special types of bodies that are meant to be user-controlled. They are not affected by physics at all; to other types of bodies, such as a character or a rigid body, these are the same as a static body. However, they have two main uses:
 *
 * **Simulated motion:** When these bodies are moved manually, either from code or from an [AnimationPlayer] (with [member AnimationPlayer.playback_process_mode] set to "physics"), the physics will automatically compute an estimate of their linear and angular velocity. This makes them very useful for moving platforms or other AnimationPlayer-controlled objects (like a door, a bridge that opens, etc).
 *
 * **Kinematic characters:** KinematicBody2D also has an API for moving objects (the [method move_and_collide] and [method move_and_slide] methods) while performing collision tests. This makes them really useful to implement characters that collide against a world, but don't require advanced physics.
 *
*/
declare class KinematicBody2D extends PhysicsBody2D  {

  
/**
 * Kinematic bodies are special types of bodies that are meant to be user-controlled. They are not affected by physics at all; to other types of bodies, such as a character or a rigid body, these are the same as a static body. However, they have two main uses:
 *
 * **Simulated motion:** When these bodies are moved manually, either from code or from an [AnimationPlayer] (with [member AnimationPlayer.playback_process_mode] set to "physics"), the physics will automatically compute an estimate of their linear and angular velocity. This makes them very useful for moving platforms or other AnimationPlayer-controlled objects (like a door, a bridge that opens, etc).
 *
 * **Kinematic characters:** KinematicBody2D also has an API for moving objects (the [method move_and_collide] and [method move_and_slide] methods) while performing collision tests. This makes them really useful to implement characters that collide against a world, but don't require advanced physics.
 *
*/
  new(): KinematicBody2D; 
  static "new"(): KinematicBody2D 


/**
 * Extra margin used for collision recovery in motion functions (see [method move_and_collide], [method move_and_slide], [method move_and_slide_with_snap]).
 *
 * If the body is at least this close to another body, it will consider them to be colliding and will be pushed away before performing the actual motion.
 *
 * A higher value means it's more flexible for detecting collision, which helps with consistently detecting walls and floors.
 *
 * A lower value forces the collision algorithm to use more exact detection, so it can be used in cases that specifically require precision, e.g at very low scale to avoid visible jittering, or for stability with a stack of kinematic bodies.
 *
*/
"collision/safe_margin": float;

/** If [code]true[/code], the body's movement will be synchronized to the physics frame. This is useful when animating movement via [AnimationPlayer], for example on moving platforms. Do [b]not[/b] use together with [method move_and_slide] or [method move_and_collide] functions. */
"motion/sync_to_physics": boolean;

/** Returns the floor's collision angle at the last collision point according to [code]up_direction[/code], which is [code]Vector2.UP[/code] by default. This value is always positive and only valid after calling [method move_and_slide] and when [method is_on_floor] returns [code]true[/code]. */
get_floor_angle(up_direction?: Vector2): float;

/** Returns the surface normal of the floor at the last collision point. Only valid after calling [method move_and_slide] or [method move_and_slide_with_snap] and when [method is_on_floor] returns [code]true[/code]. */
get_floor_normal(): Vector2;

/** Returns the linear velocity of the floor at the last collision point. Only valid after calling [method move_and_slide] or [method move_and_slide_with_snap] and when [method is_on_floor] returns [code]true[/code]. */
get_floor_velocity(): Vector2;

/** Returns a [KinematicCollision2D], which contains information about the latest collision that occurred during the last call to [method move_and_slide]. */
get_last_slide_collision(): KinematicCollision2D;

/**
 * Returns a [KinematicCollision2D], which contains information about a collision that occurred during the last call to [method move_and_slide] or [method move_and_slide_with_snap]. Since the body can collide several times in a single call to [method move_and_slide], you must specify the index of the collision in the range 0 to ([method get_slide_count] - 1).
 *
 * **Example usage:**
 *
 * @example 
 * 
 * for i in get_slide_count():
 *     var collision = get_slide_collision(i)
 *     print("Collided with: ", collision.collider.name)
 * @summary 
 * 
 *
*/
get_slide_collision(slide_idx: int): KinematicCollision2D;

/** Returns the number of times the body collided and changed direction during the last call to [method move_and_slide] or [method move_and_slide_with_snap]. */
get_slide_count(): int;

/** Returns [code]true[/code] if the body collided with the ceiling on the last call of [method move_and_slide] or [method move_and_slide_with_snap]. Otherwise, returns [code]false[/code]. */
is_on_ceiling(): boolean;

/** Returns [code]true[/code] if the body collided with the floor on the last call of [method move_and_slide] or [method move_and_slide_with_snap]. Otherwise, returns [code]false[/code]. */
is_on_floor(): boolean;

/** Returns [code]true[/code] if the body collided with a wall on the last call of [method move_and_slide] or [method move_and_slide_with_snap]. Otherwise, returns [code]false[/code]. */
is_on_wall(): boolean;

/**
 * Moves the body along the vector `rel_vec`. The body will stop if it collides. Returns a [KinematicCollision2D], which contains information about the collision when stopped, or when touching another body along the motion.
 *
 * If `test_only` is `true`, the body does not move but the would-be collision information is given.
 *
*/
move_and_collide(rel_vec: Vector2, infinite_inertia?: boolean, exclude_raycast_shapes?: boolean, test_only?: boolean): KinematicCollision2D;

/**
 * Moves the body along a vector. If the body collides with another, it will slide along the other body rather than stop immediately. If the other body is a [KinematicBody2D] or [RigidBody2D], it will also be affected by the motion of the other body. You can use this to make moving and rotating platforms, or to make nodes push other nodes.
 *
 * This method should be used in [method Node._physics_process] (or in a method called by [method Node._physics_process]), as it uses the physics step's `delta` value automatically in calculations. Otherwise, the simulation will run at an incorrect speed.
 *
 * `linear_velocity` is the velocity vector in pixels per second. Unlike in [method move_and_collide], you should **not** multiply it by `delta` — the physics engine handles applying the velocity.
 *
 * `up_direction` is the up direction, used to determine what is a wall and what is a floor or a ceiling. If set to the default value of `Vector2(0, 0)`, everything is considered a wall. This is useful for topdown games.
 *
 * If `stop_on_slope` is `true`, body will not slide on slopes when you include gravity in `linear_velocity` and the body is standing still.
 *
 * If the body collides, it will change direction a maximum of `max_slides` times before it stops.
 *
 * `floor_max_angle` is the maximum angle (in radians) where a slope is still considered a floor (or a ceiling), rather than a wall. The default value equals 45 degrees.
 *
 * If `infinite_inertia` is `true`, body will be able to push [RigidBody2D] nodes, but it won't also detect any collisions with them. If `false`, it will interact with [RigidBody2D] nodes like with [StaticBody2D].
 *
 * Returns the `linear_velocity` vector, rotated and/or scaled if a slide collision occurred. To get detailed information about collisions that occurred, use [method get_slide_collision].
 *
 * When the body touches a moving platform, the platform's velocity is automatically added to the body motion. If a collision occurs due to the platform's motion, it will always be first in the slide collisions.
 *
*/
move_and_slide(linear_velocity: Vector2, up_direction?: Vector2, stop_on_slope?: boolean, max_slides?: int, floor_max_angle?: float, infinite_inertia?: boolean): Vector2;

/**
 * Moves the body while keeping it attached to slopes. Similar to [method move_and_slide].
 *
 * As long as the `snap` vector is in contact with the ground, the body will remain attached to the surface. This means you must disable snap in order to jump, for example. You can do this by setting `snap` to `(0, 0)` or by using [method move_and_slide] instead.
 *
*/
move_and_slide_with_snap(linear_velocity: Vector2, snap: Vector2, up_direction?: Vector2, stop_on_slope?: boolean, max_slides?: int, floor_max_angle?: float, infinite_inertia?: boolean): Vector2;

/**
 * Checks for collisions without moving the body. Virtually sets the node's position, scale and rotation to that of the given [Transform2D], then tries to move the body along the vector `rel_vec`. Returns `true` if a collision would stop the body from moving along the whole path.
 *
 * Use [method move_and_collide] instead for detecting collision with touching bodies.
 *
*/
test_move(from: Transform2D, rel_vec: Vector2, infinite_inertia?: boolean): boolean;

  connect<T extends SignalsOf<KinematicBody2D>>(signal: T, method: SignalFunction<KinematicBody2D[T]>): number;






}

