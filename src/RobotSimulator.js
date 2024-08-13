/**
 * Robot Simulator
 * Author: Jiale Dong
 * Date: August 13, 2024
 */

import React, { useEffect, useRef } from 'react'; // Import React and hooks
import * as THREE from 'three'; // Import Three.js library
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'; // Import FBXLoader from Three.js examples
import TankModel from './Tank.fbx'; // Import the FBX model
import './RobotSimulator.css'; // Import the CSS file for styles

const RobotSimulator = () => { // Define the RobotSimulator component
    const mountRef = useRef(null); // Create a reference for the mount element
    const robotRef = useRef(null); // Create a reference for the robot model
    const velocity = 0.02; // Define the robot's movement speed
    const rotationSpeed = 0.05; // Define the robot's rotation speed

    useEffect(() => { // useEffect hook to run side-effects
        const scene = new THREE.Scene(); // Create a new Three.js scene
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000); // Create a perspective camera
        const renderer = new THREE.WebGLRenderer({ antialias: true }); // Create a WebGL renderer with antialiasing enabled
        renderer.setSize(window.innerWidth, window.innerHeight); // Set the renderer size to fill the window

        const leatherGrayColor = 0x4a4a4a; // Define the background color
        renderer.setClearColor(leatherGrayColor); // Set the renderer's clear color

        mountRef.current.appendChild(renderer.domElement); // Append the renderer's DOM element to the mountRef

        const ambientLight = new THREE.AmbientLight(0x404040, 1.5); // Create ambient light
        scene.add(ambientLight); // Add ambient light to the scene

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // Create directional light
        directionalLight.position.set(10, 10, 10); // Set the position of the directional light
        scene.add(directionalLight); // Add directional light to the scene

        const loader = new FBXLoader(); // Create a new FBXLoader instance
        loader.load(TankModel, (object) => { // Load the FBX model
            object.scale.set(0.0023, 0.0023, 0.0023); // Scale the model
            object.position.set(0, 0, 0); // Set the model's position to the origin
            robotRef.current = object; // Assign the loaded model to the robotRef

            // Traverse through the model's children and apply a material
            object.traverse((child) => { 
                if (child.isMesh) { // Check if the child is a mesh
                    child.material = new THREE.MeshStandardMaterial({ // Create and apply a standard material
                        color: 0xffa500, // Set the color to premium orange
                        metalness: 0.6, // Set the metalness value
                        roughness: 0.3, // Set the roughness value
                    });
                }
            });

            scene.add(object); // Add the model to the scene

            const animate = function () { // Define the animation loop
                requestAnimationFrame(animate); // Request the next frame
                renderer.render(scene, camera); // Render the scene with the camera
            };
            animate(); // Start the animation loop
        }, undefined, (error) => { // Handle loading errors
            console.error('An error occurred while loading the model:', error); // Log any errors
        });

        const gridHelper = new THREE.GridHelper(5, 5, 0x707070, 0x707070); // Create a grid helper
        scene.add(gridHelper); // Add the grid helper to the scene

        camera.position.y = 5; // Set the camera's Y position
        camera.position.z = 5; // Set the camera's Z position
        camera.lookAt(0, 0, 0); // Make the camera look at the origin

        // Handle mouse movement to control the robot's direction
        const handleMouseMove = (event) => { 
            if (robotRef.current) { // Check if the robot model is loaded
                const mouseX = (event.clientX / window.innerWidth) * 2 - 1; // Convert mouse X position to normalized device coordinates (NDC)
                const mouseY = -(event.clientY / window.innerHeight) * 2 + 1; // Convert mouse Y position to NDC

                const vector = new THREE.Vector3(mouseX, mouseY, 0.5).unproject(camera); // Convert mouse NDC to 3D world coordinates
                vector.sub(camera.position).normalize(); // Normalize the direction vector

                const distance = -camera.position.y / vector.y; // Calculate the distance to the ground plane
                const intersect = camera.position.clone().add(vector.multiplyScalar(distance)); // Find the intersection point with the ground

                const deltaX = intersect.x - robotRef.current.position.x; // Calculate the X distance from the robot to the intersection point
                const deltaZ = intersect.z - robotRef.current.position.z; // Calculate the Z distance from the robot to the intersection point
                const targetAngle = Math.atan2(-deltaX, -deltaZ); // Calculate the target rotation angle

                let angleDifference = targetAngle - robotRef.current.rotation.y; // Calculate the angle difference
                angleDifference = (angleDifference + Math.PI) % (2 * Math.PI) - Math.PI; // Normalize the angle difference to the range -π to π

                robotRef.current.rotation.y = THREE.MathUtils.lerp( // Smoothly rotate the robot towards the target angle
                    robotRef.current.rotation.y,
                    robotRef.current.rotation.y + angleDifference,
                    rotationSpeed
                );
            }
        };

        // Handle keyboard control - only W key is used for forward movement
        const handleKeyDown = (event) => { 
            if (robotRef.current && (event.key === 'w' || event.key === 'W')) { // Check if the robot model is loaded and W key is pressed
                const newPosition = { // Calculate the new position for the robot
                    x: robotRef.current.position.x - Math.sin(robotRef.current.rotation.y) * velocity, // Adjust the X position based on the robot's rotation
                    z: robotRef.current.position.z - Math.cos(robotRef.current.rotation.y) * velocity, // Adjust the Z position based on the robot's rotation
                };

                const gridBoundary = 2.5; // Define the grid boundary (-2.5 to 2.5)

                // Check if the new position is within the grid boundary
                if (
                    newPosition.x > -gridBoundary && newPosition.x < gridBoundary &&
                    newPosition.z > -gridBoundary && newPosition.z < gridBoundary
                ) {
                    robotRef.current.position.x = newPosition.x; // Update the robot's X position
                    robotRef.current.position.z = newPosition.z; // Update the robot's Z position
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown); // Add the keydown event listener for movement control
        window.addEventListener('mousemove', handleMouseMove); // Add the mousemove event listener for rotation control

        // Cleanup function to remove event listeners and renderer's DOM element
        return () => { 
            window.removeEventListener('keydown', handleKeyDown); // Remove the keydown event listener
            window.removeEventListener('mousemove', handleMouseMove); // Remove the mousemove event listener
            mountRef.current.removeChild(renderer.domElement); // Remove the renderer's DOM element from the mountRef
        };
    }, []); // Empty dependency array to run effect only once

    return (
        <div className="RobotSimulator" ref={mountRef}>
            <div className="instructions">
                <p>Use the mouse to control the robot's rotation.</p>
                <p>Press 'W' key to move the robot forward.</p>
            </div>
        </div>
    );
};

export default RobotSimulator; // Export the RobotSimulator component
