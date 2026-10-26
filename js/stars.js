/**
 * js/stars.js - Động cơ bầu trời sao tĩnh lặng (Deep Space Celestial Engine)
 * Tái tạo nền vũ trụ sâu thẳm, tĩnh mịch với các vì sao li ti lấp lánh nhẹ nhàng,
 * bám sát thiết kế tối giản, sang trọng và không gây chói/màu mè.
 */

(function () {
  'use strict';

  let canvas = null;
  let ctx = null;
  let animationId = null;
  let width = 0;
  let height = 0;
  let dpr = 1;

  const stars = [];
  const shootingStars = [];
  const STAR_COUNT = 240;

  // Bảng màu ánh sao tự nhiên: trắng lạnh, bạc thanh khiết và lam băng nhạt (tuyệt đối không vàng/hồng chói)
  const STAR_COLORS = [
    '#ffffff', // Trắng tinh khiết
    '#f8fafc', // Trắng bạc dịu
    '#e2e8f0', // Bạc thiên thể
    '#cbd5e1', // Bạc tro xa xăm
    '#bae6fd', // Lam băng tinh tế
    '#93c5fd'  // Ánh sao xanh thẳm
  ];

  let lastMeteorTime = Date.now();
  // Sao băng xuất hiện cực kỳ hiếm hoi (45s - 90s/lần), thanh mảnh, không gây phân tâm
  let nextMeteorDelay = 45000 + Math.random() * 45000;

  class Star {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;

      // Phân bổ độ sáng & kích thước hạt sao: 75% hạt bụi sao li ti, 20% sao vừa, 5% sao điểm xuyết
      const rand = Math.random();
      if (rand < 0.75) {
        // Hạt sao li ti (chiếm đa số, tạo cảm giác không gian vô tận)
        this.radius = 0.45 + Math.random() * 0.45; // 0.45px - 0.9px
        this.baseAlpha = 0.2 + Math.random() * 0.4;
        this.twinkleSpeed = 0.006 + Math.random() * 0.012;
        this.hasHalo = false;
      } else if (rand < 0.95) {
        // Ngôi sao kích thước vừa
        this.radius = 0.85 + Math.random() * 0.35; // 0.85px - 1.2px
        this.baseAlpha = 0.45 + Math.random() * 0.35;
        this.twinkleSpeed = 0.01 + Math.random() * 0.016;
        this.hasHalo = false;
      } else {
        // Ngôi sao nổi bật điểm xuyết (rất nhỏ và trang nhã)
        this.radius = 1.2 + Math.random() * 0.3; // 1.2px - 1.5px
        this.baseAlpha = 0.7 + Math.random() * 0.25;
        this.twinkleSpeed = 0.012 + Math.random() * 0.02;
        this.hasHalo = true;
      }

      this.color = STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)];
      this.phase = Math.random() * Math.PI * 2;
    }

    update() {
      // Sao đứng yên trong tọa độ không gian (không trôi dạt như tuyết), chỉ nhấp nháy êm dịu
      this.phase += this.twinkleSpeed;
      if (this.phase > Math.PI * 2) {
        this.phase -= Math.PI * 2;
      }
    }

    draw() {
      // Nhấp nháy điều hòa hình sin mượt mà, không giật
      const sine = (Math.sin(this.phase) + 1) / 2;
      const alpha = this.baseAlpha * (0.35 + 0.65 * sine);

      ctx.save();
      ctx.globalAlpha = Math.max(0.06, Math.min(1, alpha));

      // Hào quang siêu nhẹ cho các ngôi sao nổi bật
      if (this.hasHalo) {
        const haloGrad = ctx.createRadialGradient(
          this.x, this.y, 0,
          this.x, this.y, this.radius * 2.2
        );
        haloGrad.addColorStop(0, this.color);
        haloGrad.addColorStop(0.5, 'rgba(186, 230, 253, 0.2)');
        haloGrad.addColorStop(1, 'rgba(18, 65, 100, 0)');

        ctx.fillStyle = haloGrad;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 2.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Hạt sao chính
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  class SubtleMeteor {
    constructor() {
      this.init();
    }

    init() {
      this.x = Math.random() * (width * 0.8);
      this.y = Math.random() * (height * 0.3);
      this.angle = (35 + Math.random() * 15) * (Math.PI / 180);
      this.speed = 10 + Math.random() * 6;
      this.length = 70 + Math.random() * 50;
      this.thickness = 0.8 + Math.random() * 0.4;
      this.maxLife = 28 + Math.floor(Math.random() * 15);
      this.life = this.maxLife;
      this.alive = true;
    }

    update() {
      this.x += Math.cos(this.angle) * this.speed;
      this.y += Math.sin(this.angle) * this.speed;
      this.life--;

      if (this.life <= 0 || this.x > width + 60 || this.y > height + 60) {
        this.alive = false;
      }
    }

    draw() {
      if (!this.alive) return;

      const progress = this.life / this.maxLife;
      const alpha = Math.sin(progress * Math.PI) * 0.65; // Độ sáng mờ ảo, không gắt

      const tailX = this.x - Math.cos(this.angle) * this.length;
      const tailY = this.y - Math.sin(this.angle) * this.length;

      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

      const grad = ctx.createLinearGradient(tailX, tailY, this.x, this.y);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      grad.addColorStop(0.7, 'rgba(226, 232, 240, 0.4)');
      grad.addColorStop(1, '#ffffff');

      ctx.strokeStyle = grad;
      ctx.lineWidth = this.thickness;
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(this.x, this.y);
      ctx.stroke();

      // Đầu vệt sao
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.thickness, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  function resizeCanvas() {
    if (!canvas) return;
    dpr = window.devicePixelRatio || 1;
    width = window.innerWidth;
    height = window.innerHeight;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(dpr, dpr);
  }

  function initStars() {
    stars.length = 0;
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push(new Star());
    }
  }

  function spawnMeteorIfNeeded() {
    const now = Date.now();
    if (now - lastMeteorTime > nextMeteorDelay) {
      shootingStars.push(new SubtleMeteor());
      lastMeteorTime = now;
      nextMeteorDelay = 45000 + Math.random() * 45000;
    }
  }

  function renderLoop() {
    ctx.clearRect(0, 0, width, height);

    // 1. Vẽ các vì sao lấp lánh tĩnh lặng
    for (let i = 0; i < stars.length; i++) {
      stars[i].update();
      stars[i].draw();
    }

    // 2. Kiểm tra vệt sao hiếm hoi
    spawnMeteorIfNeeded();

    for (let i = shootingStars.length - 1; i >= 0; i--) {
      const meteor = shootingStars[i];
      meteor.update();
      meteor.draw();
      if (!meteor.alive) {
        shootingStars.splice(i, 1);
      }
    }

    animationId = requestAnimationFrame(renderLoop);
  }

  // Khởi tạo engine
  window.initStarrySky = function () {
    canvas = document.getElementById('starrySkyCanvas');
    if (!canvas) return;

    ctx = canvas.getContext('2d');
    if (!ctx) return;

    resizeCanvas();
    initStars();

    if (animationId) cancelAnimationFrame(animationId);
    animationId = requestAnimationFrame(renderLoop);

    window.addEventListener('resize', () => {
      resizeCanvas();
      initStars();
    });

    // Tự động tạm dừng animation khi chuyển tab trình duyệt
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (animationId) cancelAnimationFrame(animationId);
      } else {
        lastMeteorTime = Date.now();
        animationId = requestAnimationFrame(renderLoop);
      }
    });
  };
})();
