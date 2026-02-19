/* ============================================
   SoulWallet — Interactive JS
   3D Tilt on cube image, cursor light, parallax,
   particles, live SOL price
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

    // === Particle System ===
    const canvas = document.getElementById('particleCanvas');
    const ctx = canvas.getContext('2d');
    let particles = [];
    let mouseX = -999, mouseY = -999;
    let animFrameId;
    let W, H;
    const isMobile = ('ontouchstart' in window) || window.innerWidth < 768;

    function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
    resize();
    window.addEventListener('resize', resize);

    const COLORS = [
        { r: 153, g: 69, b: 255 },
        { r: 20, g: 241, b: 149 },
        { r: 0, g: 209, b: 255 },
        { r: 220, g: 31, b: 255 },
        { r: 255, g: 255, b: 255 },
    ];

    class Particle {
        constructor() {
            this.x = Math.random() * W;
            this.y = Math.random() * H;
            this.baseSize = Math.random() * 1.5 + 0.4;
            this.size = this.baseSize;
            this.vx = (Math.random() - 0.5) * 0.25;
            this.vy = (Math.random() - 0.5) * 0.25;
            this.alpha = Math.random() * 0.3 + 0.1;
            this.baseAlpha = this.alpha;
            this.twinkleSpeed = Math.random() * 0.012 + 0.004;
            this.twinklePhase = Math.random() * Math.PI * 2;
            this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
        }
        update(t) {
            this.x += this.vx;
            this.y += this.vy;
            this.alpha = this.baseAlpha + Math.sin(t * this.twinkleSpeed + this.twinklePhase) * 0.1;
            this.alpha = Math.max(0.04, Math.min(0.5, this.alpha));
            const dx = mouseX - this.x, dy = mouseY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 150) {
                const f = (150 - dist) / 150;
                this.x -= dx * f * 0.005;
                this.y -= dy * f * 0.005;
                this.size = this.baseSize + f * 1.2;
            } else {
                this.size += (this.baseSize - this.size) * 0.08;
            }
            if (this.x < -20) this.x = W + 20;
            if (this.x > W + 20) this.x = -20;
            if (this.y < -20) this.y = H + 20;
            if (this.y > H + 20) this.y = -20;
        }
        draw() {
            const { r, g, b } = this.color;
            if (this.size > 1) {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${r},${g},${b},${this.alpha * 0.06})`;
                ctx.fill();
            }
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${r},${g},${b},${this.alpha})`;
            ctx.fill();
        }
    }

    const pCount = isMobile ? Math.min(15, Math.floor(W * 0.02)) : Math.min(80, Math.floor(W * 0.045));
    for (let i = 0; i < pCount; i++) particles.push(new Particle());

    function drawLines() {
        if (isMobile) return; // Skip expensive O(n²) line drawing on mobile
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const d = Math.sqrt(dx * dx + dy * dy);
                if (d < 85) {
                    const a = (1 - d / 85) * 0.06;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    const gr = ctx.createLinearGradient(particles[i].x, particles[i].y, particles[j].x, particles[j].y);
                    gr.addColorStop(0, `rgba(153,69,255,${a})`);
                    gr.addColorStop(1, `rgba(20,241,149,${a})`);
                    ctx.strokeStyle = gr;
                    ctx.lineWidth = 0.4;
                    ctx.stroke();
                }
            }
        }
    }

    let t = 0;
    function animate() {
        ctx.clearRect(0, 0, W, H);
        t++;
        particles.forEach(p => { p.update(t); p.draw(); });
        drawLines();
        animFrameId = requestAnimationFrame(animate);
    }
    animate();

    // === Mouse + Cursor Glow (desktop only) ===
    if (!isMobile) {
        const cursorGlow = document.getElementById('cursorGlow');
        document.addEventListener('mousemove', e => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            if (cursorGlow) { cursorGlow.style.left = e.clientX + 'px'; cursorGlow.style.top = e.clientY + 'px'; }
        });
        document.addEventListener('mouseleave', () => { mouseX = -999; mouseY = -999; });
    }

    // === Navbar ===
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => navbar.classList.toggle('scrolled', window.scrollY > 40), { passive: true });

    // Nav active
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // ============================
    // 3D TILT on Hero Cube Image
    // ============================
    const wrapper = document.getElementById('hero3dWrapper');
    const tiltEl = document.getElementById('hero3dTilt');
    const reflect = document.getElementById('cursorReflect');
    const floatOrbs = document.querySelectorAll('.float-orb');
    const ambientGlows = document.querySelectorAll('.ambient-glow');

    let tRX = 0, tRY = 0, tRZ = 0, cRX = 0, cRY = 0, cRZ = 0;  // target / current rotation
    let tScale = 1, cScale = 1;                     // target / current scale

    if (wrapper && tiltEl) {
        wrapper.addEventListener('mouseenter', () => { tScale = 1.06; });

        wrapper.addEventListener('mouseleave', () => {
            tRX = 0; tRY = 0; tRZ = 0; tScale = 1;
            if (reflect) reflect.style.opacity = '0';
        });

        wrapper.addEventListener('mousemove', e => {
            const rect = wrapper.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const cx = rect.width / 2;
            const cy = rect.height / 2;

            // ±25° Y tilt, ±18° X tilt — more dramatic rotation
            tRY = ((x - cx) / cx) * 25;
            tRX = -((y - cy) / cy) * 18;
            // Subtle Z twist for extra depth
            tRZ = ((x - cx) / cx) * 4;

            // Light cursor reflection
            if (reflect) {
                reflect.style.left = x + 'px';
                reflect.style.top = y + 'px';
                reflect.style.opacity = '1';
            }
        });

        // Smooth tilt loop — faster lerp for snappier response
        function lerpTilt() {
            cRX += (tRX - cRX) * 0.10;
            cRY += (tRY - cRY) * 0.10;
            cRZ += (tRZ - cRZ) * 0.08;
            cScale += (tScale - cScale) * 0.09;

            tiltEl.style.transform = `
                perspective(800px)
                rotateX(${cRX}deg)
                rotateY(${cRY}deg)
                rotateZ(${cRZ}deg)
                scale(${cScale})
            `;
            requestAnimationFrame(lerpTilt);
        }
        lerpTilt();
    }

    // === Parallax on orbs, tokens, and glows ===
    const floatTokens = document.querySelectorAll('.float-token');

    document.addEventListener('mousemove', e => {
        const cx = W / 2, cy = H / 2;
        const mx = (e.clientX - cx) / cx;
        const my = (e.clientY - cy) / cy;

        floatOrbs.forEach((orb, i) => {
            const f = (i + 1) * 6;
            const dir = i % 2 === 0 ? 1 : -1;
            orb.style.transform = `translate(${mx * f * dir}px, ${my * f}px)`;
        });

        floatTokens.forEach((token, i) => {
            const f = (i + 1) * 8;
            const dir = i % 2 === 0 ? 1 : -1;
            token.style.transform = `translate(${mx * f * dir}px, ${my * f}px)`;
        });

        ambientGlows.forEach((g, i) => {
            const f = (i + 1) * 12;
            g.style.transform = `translate(${mx * f}px, ${my * f}px)`;
        });
    });

    // === Button ripple ===
    const getStartedBtn = document.getElementById('getStartedBtn');
    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', e => {
            e.preventDefault();
            const rect = getStartedBtn.getBoundingClientRect();
            const ripple = document.createElement('span');
            ripple.style.cssText = `position:absolute;border-radius:50%;background:rgba(255,255,255,0.35);width:0;height:0;left:${e.clientX - rect.left}px;top:${e.clientY - rect.top}px;transform:translate(-50%,-50%);pointer-events:none;animation:rippleFx 0.6s ease-out forwards;`;
            getStartedBtn.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        });
    }
    const s = document.createElement('style');
    s.textContent = `@keyframes rippleFx { to { width:280px;height:280px;opacity:0; } }`;
    document.head.appendChild(s);

    // === How it works ===
    const howItWorks = document.getElementById('howItWorks');
    if (howItWorks) {
        howItWorks.addEventListener('click', e => {
            e.preventDefault();
            const icon = howItWorks.querySelector('.play-icon');
            if (icon) { icon.style.transform = 'scale(0.88)'; setTimeout(() => icon.style.transform = '', 250); }
        });
    }

    // === Live SOL Price ===
    const solPriceEl = document.getElementById('solPrice');
    async function fetchSolPrice() {
        try {
            const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
            const data = await res.json();
            if (data?.solana?.usd && solPriceEl) {
                solPriceEl.textContent = '$' + data.solana.usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                solPriceEl.style.color = '#14F195';
                setTimeout(() => solPriceEl.style.color = '', 800);
            }
        } catch { if (solPriceEl) solPriceEl.textContent = '$148.50'; }
    }
    fetchSolPrice();
    setInterval(fetchSolPrice, 30000);

    // === Ambient shift ===
    let hue = 0;
    function ambientShift() {
        hue = (hue + 0.3) % 360;
        const hero = document.getElementById('hero');
        if (hero) {
            const xO = Math.sin(hue * 0.015) * 8;
            const yO = Math.cos(hue * 0.012) * 6;
            hero.style.background = `
                radial-gradient(ellipse at ${52 + xO}% ${48 + yO}%, rgba(153,69,255,0.025) 0%, transparent 45%),
                radial-gradient(ellipse at ${68 + Math.cos(hue * 0.02) * 10}% ${35 + Math.sin(hue * 0.018) * 8}%, rgba(20,241,149,0.015) 0%, transparent 35%)
            `;
        }
        requestAnimationFrame(ambientShift);
    }
    ambientShift();

    // === Mobile device orientation tilt ===
    if (window.DeviceOrientationEvent && tiltEl) {
        window.addEventListener('deviceorientation', e => {
            if (e.gamma !== null && e.beta !== null) {
                tRY = Math.max(-15, Math.min(15, e.gamma * 0.3));
                tRX = Math.max(-10, Math.min(10, (e.beta - 40) * 0.2));
            }
        });
    }

    // === Perf ===
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) cancelAnimationFrame(animFrameId);
        else animate();
    });

    // === Scroll-triggered feature section animations ===
    const featureSections = document.querySelectorAll('.feature-section');
    if (featureSections.length) {
        const sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                }
            });
        }, { threshold: 0.15 });
        featureSections.forEach(sec => sectionObserver.observe(sec));
    }

    // === Phone 3D cursor-responsive tilt (left↔right) ===
    const phone3d = document.getElementById('phone3d');
    const socialSection = document.getElementById('socialSection');
    if (phone3d && socialSection) {
        let phoneRY = -18, phoneRX = 6;        // current rotation
        let phoneTargetRY = -18, phoneTargetRX = 6; // target rotation

        document.addEventListener('mousemove', e => {
            if (!socialSection.classList.contains('in-view')) return;

            const rect = socialSection.getBoundingClientRect();
            // Only respond when section is near viewport
            if (rect.bottom < 0 || rect.top > window.innerHeight) return;

            // Map mouse X: 0→left (-25°) to viewport width→right (+25°)
            const mx = (e.clientX / window.innerWidth);       // 0 to 1
            const my = (e.clientY / window.innerHeight);      // 0 to 1

            phoneTargetRY = -30 + (mx * 55);  // -30° to +25°
            phoneTargetRX = 10 - (my * 14);    // 10° to -4°
        });

        function animatePhone() {
            phoneRY += (phoneTargetRY - phoneRY) * 0.06;
            phoneRX += (phoneTargetRX - phoneRX) * 0.06;

            phone3d.style.transform =
                `perspective(1200px) rotateY(${phoneRY}deg) rotateX(${phoneRX}deg) rotateZ(${phoneRY * 0.12 - 3}deg)`;

            requestAnimationFrame(animatePhone);
        }
        animatePhone();
    }

    // === Copy Trading phone cursor-responsive tilt (mirrored) ===
    const phone3dCopy = document.getElementById('phone3dCopy');
    const copySection = document.getElementById('copySection');
    if (phone3dCopy && copySection) {
        let copyRY = 18, copyRX = 6;
        let copyTargetRY = 18, copyTargetRX = 6;

        document.addEventListener('mousemove', e => {
            if (!copySection.classList.contains('in-view')) return;

            const rect = copySection.getBoundingClientRect();
            if (rect.bottom < 0 || rect.top > window.innerHeight) return;

            const mx = (e.clientX / window.innerWidth);
            const my = (e.clientY / window.innerHeight);

            // Mirrored: +25° to -25° (opposite of social section phone)
            copyTargetRY = 30 - (mx * 55);
            copyTargetRX = 10 - (my * 14);
        });

        function animateCopyPhone() {
            copyRY += (copyTargetRY - copyRY) * 0.06;
            copyRX += (copyTargetRX - copyRX) * 0.06;

            phone3dCopy.style.transform =
                `perspective(1200px) rotateY(${copyRY}deg) rotateX(${copyRX}deg) rotateZ(${copyRY * -0.12 + 3}deg)`;

            requestAnimationFrame(animateCopyPhone);
        }
        animateCopyPhone();
    }

    // === Markets phone cursor-responsive tilt (right side — same as social) ===
    const phone3dMarkets = document.getElementById('phone3dMarkets');
    const marketsSection = document.getElementById('marketsSection');
    if (phone3dMarkets && marketsSection) {
        let mkRY = -18, mkRX = 6;
        let mkTargetRY = -18, mkTargetRX = 6;

        document.addEventListener('mousemove', e => {
            if (!marketsSection.classList.contains('in-view')) return;

            const rect = marketsSection.getBoundingClientRect();
            if (rect.bottom < 0 || rect.top > window.innerHeight) return;

            const mx = (e.clientX / window.innerWidth);
            const my = (e.clientY / window.innerHeight);

            mkTargetRY = -30 + (mx * 55);  // -30° to +25°
            mkTargetRX = 10 - (my * 14);
        });

        function animateMarketsPhone() {
            mkRY += (mkTargetRY - mkRY) * 0.06;
            mkRX += (mkTargetRX - mkRX) * 0.06;

            phone3dMarkets.style.transform =
                `perspective(1200px) rotateY(${mkRY}deg) rotateX(${mkRX}deg) rotateZ(${mkRY * 0.12 - 3}deg)`;

            requestAnimationFrame(animateMarketsPhone);
        }
        animateMarketsPhone();
    }

    // === UX phone cursor-responsive tilt (left side — mirrored) ===
    const phone3dUx = document.getElementById('phone3dUx');
    const uxSection = document.getElementById('uxSection');
    if (phone3dUx && uxSection) {
        let uxRY = 18, uxRX = 6;
        let uxTargetRY = 18, uxTargetRX = 6;

        document.addEventListener('mousemove', e => {
            if (!uxSection.classList.contains('in-view')) return;

            const rect = uxSection.getBoundingClientRect();
            if (rect.bottom < 0 || rect.top > window.innerHeight) return;

            const mx = (e.clientX / window.innerWidth);
            const my = (e.clientY / window.innerHeight);

            uxTargetRY = 30 - (mx * 55);
            uxTargetRX = 10 - (my * 14);
        });

        function animateUxPhone() {
            uxRY += (uxTargetRY - uxRY) * 0.06;
            uxRX += (uxTargetRX - uxRX) * 0.06;

            phone3dUx.style.transform =
                `perspective(1200px) rotateY(${uxRY}deg) rotateX(${uxRX}deg) rotateZ(${uxRY * -0.12 + 3}deg)`;

            requestAnimationFrame(animateUxPhone);
        }
        animateUxPhone();
    }

    console.log('%c ◎ SoulWallet ', 'background: linear-gradient(135deg, #9945FF, #14F195, #00D1FF); color: #06060b; font-size: 18px; padding: 10px 24px; border-radius: 10px; font-weight: 800;');
});
