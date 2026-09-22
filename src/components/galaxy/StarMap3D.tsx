import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import {
  Compass,
  BookOpen,
  Clock,
  Award,
  ChevronRight,
  X,
  CheckCircle2,
  PlayCircle,
  RotateCcw,
  Layers,
  Search,
  Volume2,
  VolumeX,
  Sparkles,
  Info
} from 'lucide-react';

export interface Course {
  id: string;
  title: string;
  hours: number;
  level: 'básico' | 'intermedio' | 'avanzado';
  status: 'completed' | 'in-progress' | 'unexplored';
  position: [number, number, number];
  category: string;
  description?: string;
  skills?: string[];
  instructor?: string;
}

interface StarMap3DProps {
  courses?: Course[];
}

const DEFAULT_COURSES: Course[] = [
  {
    id: 'c-01',
    title: 'Fundamentos de Astrofísica & Python',
    hours: 18,
    level: 'básico',
    status: 'completed',
    position: [-10, 2, -4],
    category: 'Data Science Espacial',
    description: 'Aprende los fundamentos del análisis espectral, mecánica orbital y procesamiento de telemetría de misiones espaciales usando Python y NumPy.',
    skills: ['Python 3.12', 'NumPy', 'Mecánica Orbital', 'Matplotlib'],
    instructor: 'Dra. Elena Vance'
  },
  {
    id: 'c-02',
    title: 'Arquitectura de Datos Cuánticos',
    hours: 32,
    level: 'avanzado',
    status: 'completed',
    position: [-5, 6, -1],
    category: 'Quantum Computing',
    description: 'Diseño e implementación de algoritmos cuánticos de enrutamiento estelar y simulación de matrices densas para telecomunicaciones satelitales.',
    skills: ['Qiskit', 'Algoritmos Cuánticos', 'Entrelazamiento', 'Optimización'],
    instructor: 'Prof. Marcus Chen'
  },
  {
    id: 'c-03',
    title: 'Sistemas Autónomos de Navegación',
    hours: 24,
    level: 'intermedio',
    status: 'in-progress',
    position: [0, 0, 0],
    category: 'Robótica Espacial',
    description: 'Control de actitud orbital, SLAM tridimensional en entornos de microgravedad y navegación sensorial pasiva basada en mapas estelares.',
    skills: ['ROS 2', 'Kalman Filtering', 'Computer Vision', 'C++'],
    instructor: 'Ing. Sophia Morales'
  },
  {
    id: 'c-04',
    title: 'Inteligencia Artificial para Exoplanetas',
    hours: 28,
    level: 'avanzado',
    status: 'in-progress',
    position: [6, 4, -3],
    category: 'Machine Learning',
    description: 'Detección de tránsitos planetarios y análisis de biofirmas atmosféricas a través de redes neuronales convolucionales y transformers.',
    skills: ['PyTorch', 'Transformers', 'Espectroscopía', 'Deep Learning'],
    instructor: 'Dr. Alejandro Ruiz'
  },
  {
    id: 'c-05',
    title: 'Diseño de Hábitats en Microgravedad',
    hours: 12,
    level: 'básico',
    status: 'unexplored',
    position: [4, -5, 2],
    category: 'Bioingeniería',
    description: 'Factores ergológicos y térmicos en el diseño de módulos de soporte vital para bases orbitales sostenibles en órbitas LEO y Lunares.',
    skills: ['CAD Aeroespacial', 'Sistemas ECLSS', 'Termodinámica', 'Presurización'],
    instructor: 'Arq. Valerie Dupont'
  },
  {
    id: 'c-06',
    title: 'Ciberseguridad en Enlaces Satelitales',
    hours: 20,
    level: 'intermedio',
    status: 'unexplored',
    position: [-7, -4, 4],
    category: 'Ciberseguridad',
    description: 'Protocolos de cifrado post-cuántico, mitigación de interferencias electromagnéticas y seguridad de telemetría en constelaciones LEO.',
    skills: ['Criptografía Lattice', 'Software Defined Radio', 'Protocolo CCSDS'],
    instructor: 'Cmdr. Tarek Al-Mansoor'
  },
  {
    id: 'c-07',
    title: 'Propulsión Iónica & Fusión Compacta',
    hours: 36,
    level: 'avanzado',
    status: 'unexplored',
    position: [11, 1, 5],
    category: 'Propulsión Avanzada',
    description: 'Física de plasmas confinados, aceleradores Hall e ingeniería de toberas magnéticas para trayectorias interplanetarias de empuje continuo.',
    skills: ['Física de Plasma', 'Magnetohidrodinámica', 'Motores Hall'],
    instructor: 'Dra. Ksenia Volkova'
  },
  {
    id: 'c-08',
    title: 'Sensores Remotos & Observación Terrestre',
    hours: 16,
    level: 'básico',
    status: 'unexplored',
    position: [-2, -7, -2],
    category: 'Geoinformática',
    description: 'Procesamiento de imágenes SAR multiespectrales, cálculo de índices de vegetación e identificación de anomalías climáticas terrestres.',
    skills: ['Google Earth Engine', 'SAR', 'GeoJSON', 'Radiometría'],
    instructor: 'MSc. Mateo Beltrán'
  }
];

const STATUS_CONFIG = {
  completed: {
    color: '#FBBF24',
    glowColor: '#F59E0B',
    haloColor: '#d97706',
    label: 'Completado',
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    lightColor: 0xfbbf24,
    lightIntensity: 3.2
  },
  'in-progress': {
    color: '#C084FC',
    glowColor: '#9333EA',
    haloColor: '#7e22ce',
    label: 'En Progreso',
    badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    lightColor: 0xc084fc,
    lightIntensity: 2.8
  },
  unexplored: {
    color: '#38BDF8',
    glowColor: '#0284C7',
    haloColor: '#0369a1',
    label: 'Sin Explorar',
    badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    lightColor: 0x38bdf8,
    lightIntensity: 2.0
  }
};

export default function StarMap3D({ courses = DEFAULT_COURSES }: StarMap3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [hoveredCourseIdState, setHoveredCourseIdState] = useState<string | null>(null);
  const [screenLabels, setScreenLabels] = useState<
    Array<{ id: string; title: string; category: string; hours: number; level: string; status: Course['status']; x: number; y: number; visible: boolean }>
  >([]);

  // Filtering list
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const matchesLevel = filterLevel === 'all' || c.level === filterLevel;
      const matchesSearch =
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.category.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesLevel && matchesSearch;
    });
  }, [courses, filterLevel, searchTerm]);

  // Overall statistics
  const stats = useMemo(() => {
    const completed = courses.filter((c) => c.status === 'completed').length;
    const inProgress = courses.filter((c) => c.status === 'in-progress').length;
    const totalHours = courses.reduce((acc, curr) => acc + curr.hours, 0);
    const progressPercent = Math.round((completed / courses.length) * 100);
    return { completed, inProgress, totalHours, progressPercent };
  }, [courses]);

  // Ref to pass updated selected course to render loop
  const selectedCourseRef = useRef<Course | null>(selectedCourse);
  useEffect(() => {
    selectedCourseRef.current = selectedCourse;
  }, [selectedCourse]);

  const filteredCoursesRef = useRef<Course[]>(filteredCourses);
  useEffect(() => {
    filteredCoursesRef.current = filteredCourses;
  }, [filteredCourses]);

  // Orbit navigation states
  const orbitState = useRef({
    isDragging: false,
    prevMousePos: { x: 0, y: 0 },
    spherical: new THREE.Spherical(32, Math.PI / 2.3, 0),
    targetSpherical: new THREE.Spherical(32, Math.PI / 2.3, 0),
    center: new THREE.Vector3(0, 0, 0),
    targetCenter: new THREE.Vector3(0, 0, 0),
    isFocusingCourse: false
  });

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let width = container.clientWidth;
    let height = container.clientHeight;

    // Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#050814');

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 8, 30);
    camera.lookAt(0, 0, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Ambient Lighting
    const ambientLight = new THREE.AmbientLight(0x1e1b4b, 0.45);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xe0f2fe, 0.8);
    dirLight.position.set(15, 25, 20);
    scene.add(dirLight);

    const purpleLight = new THREE.DirectionalLight(0x7c3aed, 0.4);
    purpleLight.position.set(-20, 10, -10);
    scene.add(purpleLight);

    const nebulaShader = {
      uniforms: {
        uTime: { value: 0 },
        uColorA: { value: new THREE.Color('#3b0764') }, // Deep Cosmic Violet
        uColorB: { value: new THREE.Color('#7C3AED') }, // Violet
        uColorC: { value: new THREE.Color('#1e1b4b') }, // Outer Void (indigo)
        uColorD: { value: new THREE.Color('#92400e') }  // Warm accent (top-left)
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.9999, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColorA;
        uniform vec3 uColorB;
        uniform vec3 uColorC;
        uniform vec3 uColorD;
        varying vec2 vUv;

        float hash(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          float a = hash(i);
          float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0));
          float d = hash(i + vec2(1.0, 1.0));
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
        }

        float fbm(vec2 p) {
          float v = 0.0;
          float a = 0.5;
          for (int i = 0; i < 4; i++) {
            v += a * noise(p);
            p *= 2.0;
            a *= 0.5;
          }
          return v;
        }

        void main() {
          vec2 uv = vUv * 2.0 - 1.0;
          float dist = length(uv);
          
          float n = fbm(uv * 1.6 + vec2(uTime * 0.03, uTime * 0.02));
          float swirl = sin(dist * 3.5 - uTime * 0.08 + n * 2.5);
          
          float mask = smoothstep(1.3, 0.15, dist);
          vec3 mixedNebula = mix(uColorA, uColorB, n + swirl * 0.25);
          vec3 finalColor = mix(uColorC, mixedNebula, mask * (n * 0.8 + 0.25));

          // Subtle warm volumetric light in the top-left corner
          float warm = pow(clamp((1.0 - vUv.x) * vUv.y, 0.0, 1.0), 1.5) * 1.6;
          finalColor += uColorD * warm * (0.6 + 0.4 * n);

          // Partially transparent so the aurora layer shows through
          float alpha = clamp(0.45 + mask * (n * 0.8 + 0.25), 0.0, 1.0);
          gl_FragColor = vec4(finalColor, alpha);
        }
      `
    };

    // Aurora layer (behind the nebula)
    const auroraMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColorA: { value: new THREE.Color('#4C1D95') },
        uColorB: { value: new THREE.Color('#7C3AED') }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.99995, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColorA;
        uniform vec3 uColorB;
        varying vec2 vUv;

        void main() {
          float wave = sin(vUv.x * 4.0 + uTime * 0.3) * 0.5 + sin(vUv.y * 3.0 - uTime * 0.2) * 0.5;
          float t = 0.5 + 0.5 * sin(uTime * 0.25 + wave);
          vec3 col = mix(uColorA, uColorB, t);
          float band = smoothstep(0.0, 0.5, vUv.y) * smoothstep(1.0, 0.4, vUv.y);
          float alpha = (0.35 + 0.25 * sin(uTime * 0.4 + vUv.x * 5.0)) * band;
          gl_FragColor = vec4(col, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      depthTest: false
    });
    const auroraGeo = new THREE.PlaneGeometry(2, 2);
    const auroraMesh = new THREE.Mesh(auroraGeo, auroraMat);
    auroraMesh.renderOrder = -2;
    auroraMesh.frustumCulled = false;
    scene.add(auroraMesh);

    const nebulaMat = new THREE.ShaderMaterial({
      ...nebulaShader,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      side: THREE.DoubleSide
    });
    const nebulaGeo = new THREE.PlaneGeometry(2, 2);
    const nebulaMesh = new THREE.Mesh(nebulaGeo, nebulaMat);
    nebulaMesh.renderOrder = -1;
    nebulaMesh.frustumCulled = false;
    scene.add(nebulaMesh);

    // Soft circular glow texture for particles
    const makeCircleTexture = () => {
      const size = 64;
      const c = document.createElement('canvas');
      c.width = size;
      c.height = size;
      const ctx = c.getContext('2d')!;
      const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.25, 'rgba(255,255,255,0.8)');
      grad.addColorStop(0.6, 'rgba(255,255,255,0.2)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.fill();
      return new THREE.CanvasTexture(c);
    };
    const circleTexture = makeCircleTexture();

    const starCount = 2600;
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);

    const palette = [
      new THREE.Color('#60A5FA'), // Sky Blue
      new THREE.Color('#A855F7'), // Violet
      new THREE.Color('#34D399'), // Emerald Green
      new THREE.Color('#FBBF24'), // Warm Yellow
      new THREE.Color('#FFFFFF')  // Pure White
    ];

    for (let i = 0; i < starCount; i++) {
      const radius = 25 + Math.random() * 55;
      const theta = THREE.MathUtils.randFloat(0, Math.PI * 2);
      const phi = THREE.MathUtils.randFloat(0, Math.PI);

      starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = radius * Math.cos(phi);

      const color = palette[Math.floor(Math.random() * palette.length)];
      starColors[i * 3] = color.r;
      starColors[i * 3 + 1] = color.g;
      starColors[i * 3 + 2] = color.b;

      starSizes[i] = Math.random() * 2.2 + 0.3;
    }

    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 0.7,
      map: circleTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    const shootingStarCount = 4;
    const shootingStarsGroup = new THREE.Group();
    scene.add(shootingStarsGroup);

    const shootingStarData = Array.from({ length: shootingStarCount }).map(() => ({
      speed: 20 + Math.random() * 15,
      progress: 1.0,
      start: new THREE.Vector3(),
      dir: new THREE.Vector3(),
      length: 6 + Math.random() * 4
    }));

    const shootingStarLines: THREE.Line[] = [];
    for (let i = 0; i < shootingStarCount; i++) {
      const lineGeom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, 0)
      ]);
      const lineMat = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.0,
        blending: THREE.AdditiveBlending,
        linewidth: 3
      });
      const line = new THREE.Line(lineGeom, lineMat);
      shootingStarLines.push(line);
      shootingStarsGroup.add(line);
    }

    const coursesGroup = new THREE.Group();
    scene.add(coursesGroup);

    const courseMeshMap = new Map<
      string,
      {
        core: THREE.Mesh;
        halo: THREE.Mesh;
        ring?: THREE.Mesh;
        light: THREE.PointLight;
        baseRadius: number;
        course: Course;
      }
    >();

    // Constellation lines linking nodes
    const constellationGeom = new THREE.BufferGeometry();
    const constellationMat = new THREE.LineDashedMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.5,
      dashSize: 0.8,
      gapSize: 0.4,
      blending: THREE.AdditiveBlending
    });
    const constellationLine = new THREE.Line(constellationGeom, constellationMat);
    scene.add(constellationLine);

    // Function to populate course spheres
    const updateCourseNodes = (coursesList: Course[]) => {
      // Clear old meshes
      while (coursesGroup.children.length > 0) {
        coursesGroup.remove(coursesGroup.children[0]);
      }
      courseMeshMap.clear();

      coursesList.forEach((course) => {
        const style = STATUS_CONFIG[course.status];
        const baseRadius = 0.25 + (course.hours / 60) * 0.35;

        const nodeGroup = new THREE.Group();
        nodeGroup.position.set(...course.position);

        // Core Sphere
        const coreGeom = new THREE.SphereGeometry(baseRadius, 32, 32);
        const coreMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(style.color),
          emissive: new THREE.Color(style.glowColor),
          emissiveIntensity: 1.4,
          roughness: 0.15,
          metalness: 0.7
        });
        const coreMesh = new THREE.Mesh(coreGeom, coreMat);
        coreMesh.userData = { courseId: course.id };
        nodeGroup.add(coreMesh);

        // Glowing outer halo
        const haloGeom = new THREE.SphereGeometry(baseRadius * 1.55, 24, 24);
        const haloMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color(style.haloColor),
          transparent: true,
          opacity: 0.35,
          blending: THREE.AdditiveBlending,
          side: THREE.BackSide,
          depthWrite: false
        });
        const haloMesh = new THREE.Mesh(haloGeom, haloMat);
        nodeGroup.add(haloMesh);

        // Point Light
        const pLight = new THREE.PointLight(style.lightColor, style.lightIntensity, 8, 2);
        nodeGroup.add(pLight);

        // Thin semi-transparent orbit ring for every course
        const ringStyle =
          course.status === 'completed'
            ? { color: 0xfbbf24, opacity: 0.3 }
            : course.status === 'in-progress'
            ? { color: 0xd8b4fe, opacity: 0.6 }
            : { color: 0x38bdf8, opacity: 0.2 };
        const ringGeom = new THREE.RingGeometry(baseRadius * 1.9, baseRadius * 1.95, 64);
        const ringMat = new THREE.MeshBasicMaterial({
          color: ringStyle.color,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: ringStyle.opacity,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });
        const ringMesh = new THREE.Mesh(ringGeom, ringMat);
        ringMesh.rotation.x = Math.PI / 2.3 + (course.hours % 7) * 0.08;
        nodeGroup.add(ringMesh);

        coursesGroup.add(nodeGroup);
        courseMeshMap.set(course.id, {
          core: coreMesh,
          halo: haloMesh,
          ring: ringMesh,
          light: pLight,
          baseRadius,
          course
        });
      });

      // Update Constellation Lines
      if (coursesList.length >= 2) {
        const points = coursesList.map((c) => new THREE.Vector3(...c.position));
        const lineGeom = new THREE.BufferGeometry().setFromPoints(points);
        constellationLine.geometry.dispose();
        constellationLine.geometry = lineGeom;
        constellationLine.computeLineDistances();
        constellationLine.visible = true;
      } else {
        constellationLine.visible = false;
      }
    };

    updateCourseNodes(filteredCoursesRef.current);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let hoveredCourseId: string | null = null;

    const onPointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      // Handle Orbit Dragging
      if (orbitState.current.isDragging) {
        const deltaX = e.clientX - orbitState.current.prevMousePos.x;
        const deltaY = e.clientY - orbitState.current.prevMousePos.y;

        orbitState.current.targetSpherical.theta -= deltaX * 0.005;
        orbitState.current.targetSpherical.phi = Math.max(
          0.1,
          Math.min(Math.PI - 0.1, orbitState.current.targetSpherical.phi - deltaY * 0.005)
        );

        orbitState.current.prevMousePos = { x: e.clientX, y: e.clientY };
        return;
      }

      // Raycast against course sphere cores
      raycaster.setFromCamera(mouse, camera);
      const interactiveMeshes = Array.from(courseMeshMap.values()).map((item) => item.core);
      const intersects = raycaster.intersectObjects(interactiveMeshes);

      if (intersects.length > 0) {
        const id = intersects[0].object.userData.courseId;
        if (hoveredCourseId !== id) {
          hoveredCourseId = id;
          setHoveredCourseIdState(id);
          container.style.cursor = 'pointer';
        }
      } else {
        if (hoveredCourseId !== null) {
          hoveredCourseId = null;
          setHoveredCourseIdState(null);
          container.style.cursor = 'grab';
        }
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      orbitState.current.isDragging = true;
      orbitState.current.prevMousePos = { x: e.clientX, y: e.clientY };
      container.style.cursor = 'grabbing';
    };

    const onMouseUp = (e: MouseEvent) => {
      orbitState.current.isDragging = false;
      container.style.cursor = hoveredCourseId ? 'pointer' : 'grab';
    };

    const onClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const clickMouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      raycaster.setFromCamera(clickMouse, camera);
      const interactiveMeshes = Array.from(courseMeshMap.values()).map((item) => item.core);
      const intersects = raycaster.intersectObjects(interactiveMeshes);

      if (intersects.length > 0) {
        const courseId = intersects[0].object.userData.courseId;
        const targetCourse = courses.find((c) => c.id === courseId);
        if (targetCourse) {
          setSelectedCourse(targetCourse);
          // Set focus coordinates for cinematic zoom
          const [tx, ty, tz] = targetCourse.position;
          orbitState.current.targetCenter.set(tx, ty, tz);
          orbitState.current.targetSpherical.radius = 11;
          orbitState.current.isFocusingCourse = true;
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY * 0.02;
      orbitState.current.targetSpherical.radius = Math.max(
        5,
        Math.min(55, orbitState.current.targetSpherical.radius + zoomFactor)
      );
    };

    // Touch event handlers for mobile devices
    let touchStartDist = 0;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        orbitState.current.isDragging = true;
        orbitState.current.prevMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        touchStartDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && orbitState.current.isDragging) {
        const deltaX = e.touches[0].clientX - orbitState.current.prevMousePos.x;
        const deltaY = e.touches[0].clientY - orbitState.current.prevMousePos.y;

        orbitState.current.targetSpherical.theta -= deltaX * 0.006;
        orbitState.current.targetSpherical.phi = Math.max(
          0.1,
          Math.min(Math.PI - 0.1, orbitState.current.targetSpherical.phi - deltaY * 0.006)
        );

        orbitState.current.prevMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const diff = touchStartDist - dist;
        orbitState.current.targetSpherical.radius = Math.max(
          5,
          Math.min(55, orbitState.current.targetSpherical.radius + diff * 0.05)
        );
        touchStartDist = dist;
      }
    };

    const onTouchEnd = () => {
      orbitState.current.isDragging = false;
    };

    container.addEventListener('mousemove', onPointerMove);
    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('click', onClick);
    container.addEventListener('wheel', onWheel, { passive: false });
    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth;
      height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    let animationFrameId: number;
    const clock = new THREE.Clock();
    const tempVec = new THREE.Vector3();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Update nebula shader time
      nebulaMat.uniforms.uTime.value = elapsedTime;
      auroraMat.uniforms.uTime.value = elapsedTime;

      // Animated dashed constellation lines
      constellationMat.dashSize = 0.6 + (Math.sin(elapsedTime * 1.2) * 0.5 + 0.5) * 0.9;
      constellationMat.gapSize = 0.9 - (Math.sin(elapsedTime * 1.2) * 0.5 + 0.5) * 0.6;

      // Rotate cosmic starfield slowly
      starField.rotation.y = elapsedTime * 0.015;
      starField.rotation.x = elapsedTime * 0.007;

      // Update Shooting Stars
      shootingStarData.forEach((star, idx) => {
        star.progress += delta * (star.speed * 0.04);
        if (star.progress > 1.2 && Math.random() < 0.06) {
          star.progress = 0.0;
          star.speed = 22 + Math.random() * 15;
          const side = Math.random() > 0.5 ? 1 : -1;
          star.start.set(
            side * (25 + Math.random() * 20),
            15 + Math.random() * 20,
            -10 + (Math.random() * 20 - 10)
          );
          star.dir
            .set(
              -side * (0.8 + Math.random() * 0.4),
              -(0.6 + Math.random() * 0.4),
              (Math.random() - 0.5) * 0.3
            )
            .normalize();
        }

        const line = shootingStarLines[idx];
        if (star.progress < 1.0) {
          line.visible = true;
          const currentHead = star.start.clone().addScaledVector(star.dir, star.progress * 45);
          const currentTail = currentHead.clone().addScaledVector(star.dir, -star.length);

          const positions = line.geometry.attributes.position as THREE.BufferAttribute;
          positions.setXYZ(0, currentTail.x, currentTail.y, currentTail.z);
          positions.setXYZ(1, currentHead.x, currentHead.y, currentHead.z);
          positions.needsUpdate = true;

          const mat = line.material as THREE.LineBasicMaterial;
          mat.opacity = Math.sin(star.progress * Math.PI) * 1.0;
        } else {
          line.visible = false;
        }
      });

      // Update Spheres Scale & Breathing Animation
      courseMeshMap.forEach(({ core, halo, ring, light, course }) => {
        const isHovered = hoveredCourseId === course.id;
        const isSelected = selectedCourseRef.current?.id === course.id;
        const breathing = Math.sin(elapsedTime * 2.5 + course.hours) * 0.03;

        const targetScale = (isHovered ? 1.35 : isSelected ? 1.25 : 1.0) + breathing;
        core.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.12);
        core.rotation.y += 0.01;

        const haloScale = isHovered ? 2.5 : isSelected ? 1.35 : 1.0 + breathing * 1.5;
        halo.scale.lerp(new THREE.Vector3(haloScale, haloScale, haloScale), 0.1);
        halo.rotation.z -= 0.006;

        const targetIntensity = isHovered ? 6.0 : STATUS_CONFIG[course.status].lightIntensity;
        light.intensity = THREE.MathUtils.lerp(light.intensity, targetIntensity, 0.1);

        if (ring) {
          ring.rotation.z += 0.004;
        }
      });

      // Smooth Camera & Orbit Interpolation
      orbitState.current.spherical.radius +=
        (orbitState.current.targetSpherical.radius - orbitState.current.spherical.radius) * 0.08;
      orbitState.current.spherical.theta +=
        (orbitState.current.targetSpherical.theta - orbitState.current.spherical.theta) * 0.08;
      orbitState.current.spherical.phi +=
        (orbitState.current.targetSpherical.phi - orbitState.current.spherical.phi) * 0.08;

      orbitState.current.center.lerp(orbitState.current.targetCenter, 0.07);

      // Compute camera position relative to target center
      tempVec.setFromSpherical(orbitState.current.spherical);
      camera.position.copy(orbitState.current.center).add(tempVec);
      camera.lookAt(orbitState.current.center);

      // Render Three.js Scene
      renderer.render(scene, camera);

      // Project 3D Course Coordinates to 2D HTML Screen Labels
      const updatedLabels = filteredCoursesRef.current.map((c) => {
        const worldPos = new THREE.Vector3(c.position[0], c.position[1], c.position[2]);
        worldPos.project(camera);

        const isBehindCamera = worldPos.z > 1.0;
        const screenX = (worldPos.x * 0.5 + 0.5) * width;
        const screenY = (-(worldPos.y * 0.5) + 0.5) * height;

        return {
          id: c.id,
          title: c.title,
          category: c.category,
          hours: c.hours,
          level: c.level,
          status: c.status,
          x: screenX,
          y: screenY,
          visible: !isBehindCamera && screenX > -50 && screenX < width + 50 && screenY > -50 && screenY < height + 50
        };
      });

      setScreenLabels(updatedLabels);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousemove', onPointerMove);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('click', onClick);
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);

      // Dispose Geometries and Materials
      renderer.dispose();
      starGeo.dispose();
      starMat.dispose();
      nebulaGeo.dispose();
      nebulaMat.dispose();
      auroraGeo.dispose();
      auroraMat.dispose();
      circleTexture.dispose();
      constellationGeom.dispose();
      constellationMat.dispose();
    };
  }, []);

  const handleResetCamera = useCallback(() => {
    setSelectedCourse(null);
    orbitState.current.targetCenter.set(0, 0, 0);
    orbitState.current.targetSpherical.radius = 32;
    orbitState.current.targetSpherical.phi = Math.PI / 2.3;
    orbitState.current.targetSpherical.theta = 0;
    orbitState.current.isFocusingCourse = false;
  }, []);

  const handleSelectFromBadge = (courseId: string) => {
    const course = courses.find((c) => c.id === courseId);
    if (course) {
      setSelectedCourse(course);
      const [tx, ty, tz] = course.position;
      orbitState.current.targetCenter.set(tx, ty, tz);
      orbitState.current.targetSpherical.radius = 11;
      orbitState.current.isFocusingCourse = true;
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen bg-slate-950 overflow-hidden font-sans select-none text-slate-100 cursor-grab active:cursor-grabbing"
    >
      {/* 3D WebGL Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 block w-full h-full" />

      {/* Cinematic vignette */}
      <div
        className="absolute inset-0 z-[5] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, transparent 45%, rgba(3,7,18,0.7) 100%)'
        }}
      />

      {/* Hover tooltip (projected above the hovered sphere) */}
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        {screenLabels.map((lbl) => {
          if (!lbl.visible) return null;
          const isHovered = hoveredCourseIdState === lbl.id;
          const statusStyle = STATUS_CONFIG[lbl.status];

          return (
            <div
              key={lbl.id}
              className={`absolute -translate-x-1/2 -translate-y-full w-max max-w-[220px] bg-slate-900/90 backdrop-blur border border-white/20 rounded-xl p-3 shadow-2xl transition-all duration-150 ${
                isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }`}
              style={{
                left: `${lbl.x}px`,
                top: `${lbl.y - 20}px`
              }}
            >
              <div className="text-sm font-bold text-white leading-snug">{lbl.title}</div>
              <div className="text-[10px] font-mono text-cyan-400 mt-0.5">{lbl.category}</div>
              <div className="text-[10px] font-mono uppercase text-slate-400 tracking-wider mt-1">
                {lbl.hours}H • {lbl.level}
              </div>
              <span
                className={`inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-mono border ${statusStyle.badgeBg}`}
              >
                {statusStyle.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Top Header Navigation */}
      <header className="absolute top-0 left-0 right-0 z-20 pointer-events-none p-4 sm:p-6 flex items-center justify-between">
        {/* Brand & Constellation Title */}
        <div className="pointer-events-auto flex items-center gap-3 bg-slate-900/60 backdrop-blur-xl border border-white/10 px-4 py-2.5 rounded-2xl shadow-2xl">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 text-white shadow-lg shadow-cyan-500/20">
            <Compass className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-purple-200">
              STARPATH • COSMOS LMS
            </h1>
            <p className="text-[11px] font-mono text-cyan-400/80">
              CARTA DE APRENDIZAJE TRIDIMENSIONAL v2.4
            </p>
          </div>
        </div>

        {/* Constellation Progress Bar HUD */}
        <div className="pointer-events-auto hidden md:flex items-center gap-6 bg-slate-900/60 backdrop-blur-xl border border-white/10 px-5 py-2.5 rounded-2xl shadow-2xl">
          <div className="flex items-center gap-2.5">
            <div className="flex flex-col text-right">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Progreso Total</span>
              <span className="text-sm font-bold text-white font-mono">{stats.progressPercent}%</span>
            </div>
            <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden border border-white/10">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 via-purple-500 to-amber-400 transition-all duration-700"
                style={{ width: `${stats.progressPercent}%` }}
              />
            </div>
          </div>

          <div className="h-6 w-[1px] bg-white/10" />

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-amber-300">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>{stats.completed} Completados</span>
            </div>
            <div className="flex items-center gap-1.5 text-purple-300">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              <span>{stats.inProgress} En curso</span>
            </div>
          </div>
        </div>

        {/* Quick Actions HUD */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2.5 rounded-xl bg-slate-900/70 hover:bg-slate-800 border border-white/10 backdrop-blur-md text-slate-300 hover:text-white transition-colors"
            title={soundEnabled ? 'Silenciar ambiente espacial' : 'Activar audio cósmico'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button
            onClick={handleResetCamera}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900/70 hover:bg-slate-800 border border-white/10 backdrop-blur-md text-xs font-mono text-cyan-300 hover:text-cyan-200 transition-colors"
            title="Restablecer vista general"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">VISTA GENERAL</span>
          </button>
        </div>
      </header>

      {/* Top Filter and Search Bar */}
      <div className="absolute top-20 left-4 sm:left-6 z-20 pointer-events-auto flex flex-wrap items-center gap-2 max-w-[calc(100vw-2rem)]">
        {/* Search */}
        <div className="relative flex items-center bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-xl px-3 py-1.5 shadow-lg">
          <Search className="w-3.5 h-3.5 text-slate-400 mr-2" />
          <input
            type="text"
            placeholder="Buscar estrella de curso..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent text-xs text-slate-200 placeholder-slate-500 focus:outline-none w-36 sm:w-48 font-mono"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="text-slate-400 hover:text-white text-xs">
              ×
            </button>
          )}
        </div>

        {/* Level Filters */}
        <div className="flex items-center gap-1 bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-xl p-1 shadow-lg text-xs font-mono">
          {(['all', 'básico', 'intermedio', 'avanzado'] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilterLevel(lvl)}
              className={`px-2.5 py-1 rounded-lg capitalize transition-all ${
                filterLevel === lvl
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold shadow-inner'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              {lvl === 'all' ? 'Todos' : lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Left Legend */}
      <div className="absolute bottom-6 left-6 z-20 pointer-events-auto hidden md:block">
        <div className="bg-slate-900/70 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl max-w-xs">
          <div className="flex items-center gap-2 mb-2.5 text-xs font-semibold tracking-wider text-slate-300 uppercase">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Topología de Constelación</span>
          </div>
          <div className="space-y-2 text-[11px] font-mono text-slate-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-400 shadow-md shadow-amber-400/50" />
                <span>Completado</span>
              </div>
              <span className="text-slate-500">Oro Estelar</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-purple-500 shadow-md shadow-purple-500/50" />
                <span>En Progreso</span>
              </div>
              <span className="text-slate-500">Púrpura Cuántico</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-sky-400 shadow-md shadow-sky-400/50" />
                <span>Sin Explorar</span>
              </div>
              <span className="text-slate-500">Azul Nebular</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-white/10 text-[10px] text-slate-400">
            * El radio de cada astro representa el volumen de horas lectivas.
          </div>
        </div>
      </div>

      {/* Course Detail Drawer Modal */}
      {selectedCourse && (
        <aside className="absolute top-0 right-0 h-full w-full sm:w-[420px] z-30 pointer-events-auto bg-slate-950/85 backdrop-blur-2xl border-l border-white/10 shadow-2xl p-6 flex flex-col justify-between transform transition-transform duration-500 ease-out">
          <div>
            {/* Header & Close */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border ${
                    STATUS_CONFIG[selectedCourse.status].badgeBg
                  }`}
                >
                  {STATUS_CONFIG[selectedCourse.status].label}
                </span>
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                  NODO {selectedCourse.id}
                </span>
              </div>
              <button
                onClick={() => setSelectedCourse(null)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                aria-label="Cerrar panel de curso"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Course Meta */}
            <div className="mt-5 space-y-4">
              <div className="text-xs font-mono uppercase tracking-widest text-cyan-400">
                {selectedCourse.category}
              </div>
              <h2 className="text-2xl font-bold leading-snug text-white">{selectedCourse.title}</h2>

              <div className="grid grid-cols-2 gap-3 py-3">
                <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <div>
                    <div className="text-[10px] text-slate-400 font-mono">DURACIÓN</div>
                    <div className="text-sm font-bold text-slate-200">{selectedCourse.hours} Horas</div>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3">
                  <Award className="w-4 h-4 text-purple-400" />
                  <div>
                    <div className="text-[10px] text-slate-400 font-mono">NIVEL</div>
                    <div className="text-sm font-bold text-slate-200 capitalize">{selectedCourse.level}</div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Bitácora de Misión
                </h3>
                <p className="text-xs leading-relaxed text-slate-300">
                  {selectedCourse.description ||
                    'Explora las fronteras del conocimiento orbital a través de módulos interactivos prácticos.'}
                </p>
              </div>

              {/* Skills */}
              {selectedCourse.skills && selectedCourse.skills.length > 0 && (
                <div>
                  <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                    Habilidades Desbloqueables
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCourse.skills.map((skill, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-cyan-950/40 border border-cyan-500/20 text-cyan-300 text-[11px] font-mono"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Instructor */}
              {selectedCourse.instructor && (
                <div className="pt-2 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                    {selectedCourse.instructor.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-mono">COMANDANTE DOCENTE</div>
                    <div className="text-xs font-semibold text-slate-200">{selectedCourse.instructor}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Button Footer */}
          <div className="pt-6 border-t border-white/10 space-y-3">
            <button
              className={`w-full py-3.5 px-4 rounded-xl font-medium tracking-wide text-sm flex items-center justify-center gap-2 transition-all shadow-xl ${
                selectedCourse.status === 'completed'
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                  : selectedCourse.status === 'in-progress'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-500/30'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/30'
              }`}
            >
              {selectedCourse.status === 'completed' ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Repasar Misión Completada</span>
                </>
              ) : selectedCourse.status === 'in-progress' ? (
                <>
                  <PlayCircle className="w-4 h-4" />
                  <span>Continuar Misión Activa</span>
                </>
              ) : (
                <>
                  <BookOpen className="w-4 h-4" />
                  <span>Iniciar Exploración</span>
                </>
              )}
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>

            <button
              onClick={() => setSelectedCourse(null)}
              className="w-full py-2 text-center text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors"
            >
              Regresar a la carta estelar
            </button>
          </div>
        </aside>
      )}

      {/* Footer Navigation Hints */}
      <footer className="absolute bottom-4 right-6 z-20 pointer-events-none hidden sm:flex items-center gap-4 text-[11px] font-mono text-slate-500 bg-slate-950/40 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/5">
        <span>Arrastra: Giro orbital</span>
        <span>•</span>
        <span>Scroll: Zoom estelar</span>
        <span>•</span>
        <span>Click en astro: Focalizar nodo</span>
      </footer>
    </div>
  );
}