(() => {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canvas = document.getElementById("plankton-field");
  const gl = canvas && canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "high-performance" });
  const PARTICLE_COUNT = 4200;
  window.__wakeParticleCount = PARTICLE_COUNT;
  const pointer = { x: -9999, y: -9999, seen: false, speed: 0 };

  if (canvas && gl) {
    let width = 1, height = 1, dpr = 1, last = performance.now();
    const positions = new Float32Array(PARTICLE_COUNT * 2);
    const life = new Float32Array(PARTICLE_COUNT);
    const seed = new Float32Array(PARTICLE_COUNT);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const ix = i * 2;
      positions[ix] = Math.random();
      positions[ix + 1] = Math.random();
      seed[i] = Math.random() * 10;
      life[i] = reduced ? Math.max(0.04, 1 - Math.hypot(positions[ix] - 0.43, positions[ix + 1] - 0.48) * 2.2) : Math.random() * 0.12;
    }
    const vert = "attribute vec2 a_position;attribute float a_life;varying float v_life;void main(){vec2 clip=a_position*2.0-1.0;gl_Position=vec4(clip.x,-clip.y,0.0,1.0);gl_PointSize=mix(1.2,4.8,clamp(a_life,0.0,1.0));v_life=a_life;}";
    const frag = "precision mediump float;varying float v_life;void main(){vec2 c=gl_PointCoord-vec2(.5);float d=length(c);float alpha=smoothstep(.5,.06,d)*clamp(v_life,.08,1.0);vec3 dormant=vec3(.02,.13,.15);vec3 trace=vec3(.403,.91,.976);vec3 wake=vec3(.22,.741,.973);vec3 col=mix(dormant,mix(trace,wake,v_life),clamp(v_life*1.35,0.0,1.0));gl_FragColor=vec4(col,alpha);}";
    function shader(type, source) { const s = gl.createShader(type); gl.shaderSource(s, source); gl.compileShader(s); return s; }
    const program = gl.createProgram();
    gl.attachShader(program, shader(gl.VERTEX_SHADER, vert));
    gl.attachShader(program, shader(gl.FRAGMENT_SHADER, frag));
    gl.linkProgram(program);
    gl.useProgram(program);
    const posBuffer = gl.createBuffer();
    const lifeBuffer = gl.createBuffer();
    const posLoc = gl.getAttribLocation(program, "a_position");
    const lifeLoc = gl.getAttribLocation(program, "a_life");
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, lifeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, life, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(lifeLoc);
    gl.vertexAttribPointer(lifeLoc, 1, gl.FLOAT, false, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.clearColor(0.0039, 0.0157, 0.0392, 1);

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, Math.floor(window.innerWidth * dpr));
      height = Math.max(1, Math.floor(window.innerHeight * dpr));
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      gl.viewport(0, 0, width, height);
    }
    function currentX(x, y, t, s) { return (Math.sin(y * 11 + t * 0.00022 + s) + Math.sin((x + y) * 7 + t * 0.00015)) * 0.000045; }
    function currentY(x, y, t, s) { return (Math.cos(x * 9 + t * 0.00018 + s) + Math.sin((x - y) * 6 + t * 0.00012)) * 0.000035; }
    function render(now) {
      const dt = Math.min(33, now - last);
      last = now;
      if (!reduced) {
        const px = pointer.x / Math.max(1, window.innerWidth);
        const py = pointer.y / Math.max(1, window.innerHeight);
        const radius = Math.min(0.18, 0.035 + pointer.speed * 0.00018);
        const power = Math.min(1, pointer.speed / 900);
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          const ix = i * 2;
          let x = positions[ix], y = positions[ix + 1];
          x += currentX(x, y, now, seed[i]) * dt;
          y += currentY(x, y, now, seed[i]) * dt;
          if (x < 0) x += 1; else if (x > 1) x -= 1;
          if (y < 0) y += 1; else if (y > 1) y -= 1;
          if (pointer.seen) {
            const dx = x - px, dy = y - py;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < radius) life[i] = Math.min(1, life[i] + (1 - dist / radius) * (0.12 + power * 0.9));
          }
          life[i] = Math.max(0.025, life[i] - dt * 0.00036);
          positions[ix] = x; positions[ix + 1] = y;
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer); gl.bufferSubData(gl.ARRAY_BUFFER, 0, positions);
        gl.bindBuffer(gl.ARRAY_BUFFER, lifeBuffer); gl.bufferSubData(gl.ARRAY_BUFFER, 0, life);
      }
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.POINTS, 0, PARTICLE_COUNT);
      if (!reduced) requestAnimationFrame(render);
    }
    function move(event) {
      const t = event.touches && event.touches[0];
      const x = t ? t.clientX : event.clientX;
      const y = t ? t.clientY : event.clientY;
      if (pointer.seen) pointer.speed = Math.hypot(x - pointer.x, y - pointer.y) * 60;
      pointer.x = x; pointer.y = y; pointer.seen = true;
    }
    resize();
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("touchmove", move, { passive: true });
    requestAnimationFrame(render);
  }

  let lastScroll = window.scrollY;
  const header = document.querySelector("[data-scroll-nav]");
  function onScroll() {
    const y = window.scrollY;
    document.documentElement.style.setProperty("--scroll", String(y));
    if (header) {
      header.classList.toggle("is-scrolled", y > 20);
      header.classList.toggle("is-hidden", y > lastScroll && y > 180);
    }
    lastScroll = y;
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    document.querySelectorAll(".magnetic").forEach((el) => {
      el.addEventListener("pointermove", (event) => {
        const rect = el.getBoundingClientRect();
        const mx = (event.clientX - rect.left - rect.width / 2) * 0.18;
        const my = (event.clientY - rect.top - rect.height / 2) * 0.18;
        el.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
      });
      el.addEventListener("pointerleave", () => { el.style.transform = ""; });
    });
  }

  document.querySelectorAll(".service-choice,.date-choice,.time-choice").forEach((button) => {
    button.addEventListener("click", () => {
      button.parentElement.querySelectorAll("button").forEach((b) => b.classList.remove("is-selected"));
      button.classList.add("is-selected");
    });
  });
  const form = document.querySelector(".booking-form");
  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const note = form.querySelector(".form-note");
      if (note) note.textContent = "This demo form does not submit.";
    });
  }
})();
