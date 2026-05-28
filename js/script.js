/* ============================================================
   Dashboard Script — شبكة الميادين الرقمية
   ============================================================ */

;(function () {
  'use strict';

  // ============================================================
  // MOCK DATA
  // ============================================================
  const MOCK_OPERATIONS = [
    { id: 'NET-9982-001', pkg: '100', count: 500, date: '2026-05-28', time: '10:23 ص', status: 'success' },
    { id: 'NET-9982-002', pkg: '200', count: 300, date: '2026-05-27', time: '14:45 م', status: 'success' },
    { id: 'NET-9982-003', pkg: '500', count: 150, date: '2026-05-27', time: '09:12 ص', status: 'success' },
    { id: 'NET-9982-004', pkg: '1000', count: 50, date: '2026-05-26', time: '16:30 م', status: 'success' },
    { id: 'NET-9982-005', pkg: '100', count: 1000, date: '2026-05-25', time: '11:00 ص', status: 'pending' },
  ];

  const MOCK_LOGS = [
    { msg: 'تم إرسال دفعة كروت باقة 100 عدد 500 كرت بنجاح', icon: 'fa-box', time: 'منذ ساعتين' },
    { msg: 'تم إرسال دفعة كروت باقة 200 عدد 300 كرت بنجاح', icon: 'fa-box', time: 'منذ 5 ساعات' },
    { msg: 'تم تحويل أرباح الدفعة رقم #NET-9982-003 إلى المحفظة', icon: 'fa-coins', time: 'منذ 8 ساعات' },
    { msg: 'تم إرسال دفعة كروت باقة 500 عدد 150 كرت بنجاح', icon: 'fa-box', time: 'منذ يوم' },
    { msg: 'فشل محاولة رفع ملف - صيغة غير مدعومة (PNG)', icon: 'fa-exclamation-triangle', time: 'منذ يوم' },
    { msg: 'تم إرسال دفعة كروت باقة 1000 عدد 50 كرت بنجاح', icon: 'fa-box', time: 'منذ يومين' },
    { msg: 'تم تحديث بيانات المحفظة الإلكترونية', icon: 'fa-sync', time: 'منذ 3 أيام' },
  ];

  const MOCK_KPI = {
    cards: { value: 2450, label: 'الكروت المباعة', trend: '+12.5%', direction: 'up' },
    income: { value: 48500, label: 'إجمالي الدخل', trend: '+8.2%', direction: 'up' },
    last: { value: 'منذ 3 دقائق', label: 'آخر عملية شراء', trend: 'باقة 100', direction: 'neutral' },
    subs: { value: 1280, label: 'المشتركين النشطاء', trend: '+3.7%', direction: 'up' },
  };

  const BUYER_NAMES = ['أحمد', 'محمد', 'سارة', 'فاطمة', 'علي', 'نورة', 'خالد', 'مريم', 'يوسف', 'هند'];
  const PACKAGES = ['100', '200', '500', '1000'];

  // ============================================================
  // STATE
  // ============================================================
  const state = {
    operations: [...MOCK_OPERATIONS],
    logs: [...MOCK_LOGS],
    submittedIds: new Set(MOCK_OPERATIONS.map((o) => o.id)),
    isSubmitting: false,
    retryData: null,
    selectedFile: null,
    chartInstance: null,
  };

  // ============================================================
  // DOM REFS
  // ============================================================
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  const dom = {};

  function cacheDom() {
    dom.themeToggle = $('#theme-toggle');
    dom.themeIcon = $('#theme-icon');
    dom.toastContainer = $('#toast-container');
    dom.notifBtn = $('#notification-btn');

    dom.kpiCards = { value: $('#kpi-cards'), income: $('#kpi-income'), last: $('#kpi-last'), subs: $('#kpi-subscribers') };
    dom.kpiCardTrends = { cards: $('#kpi-cards-trend'), income: $('#kpi-income-trend'), last: $('#kpi-last-trend'), subs: $('#kpi-subs-trend') };

    dom.toggleFormBtn = $('#toggle-form-btn');
    dom.formWrapper = $('#form-wrapper');
    dom.form = $('#distribution-form');
    dom.operationId = $('#operation-id');
    dom.packageGrid = $('#package-grid');
    dom.packageRadios = $$('#package-grid input[type="radio"]');
    dom.customPkgWrap = $('#custom-pkg-wrap');
    dom.customPkgValue = $('#custom-pkg-value');
    dom.cardCount = $('#card-count');
    dom.fileInput = $('#file-input');
    dom.fileUploadZone = $('#file-upload-zone');
    dom.fileInfo = $('#file-info');
    dom.fileName = $('#file-name');
    dom.fileSize = $('#file-size');
    dom.fileRemove = $('#file-remove');
    dom.submitBtn = $('#submit-btn');
    dom.btnText = dom.submitBtn.querySelector('.btn-text');
    dom.btnLoader = dom.submitBtn.querySelector('.btn-loader');
    dom.cancelBtn = $('#cancel-form-btn');

    dom.packageError = $('#package-error');
    dom.countError = $('#count-error');
    dom.fileError = $('#file-error');

    dom.opsBody = $('#operations-body');
    dom.opsCount = $('#operations-count');
    dom.logsContainer = $('#logs-container');
    dom.logsCount = $('#logs-count');
    dom.refreshTableBtn = $('#refresh-table-btn');

    dom.chartCanvas = $('#main-chart');
    dom.chartTabs = $$('.chart-tab');
    dom.viewTabs = $$('.view-tab');

    dom.mobileMenuBtn = $('#mobile-menu-btn');
    dom.topbarNav = $('#topbar-nav');
  }

  // ============================================================
  // THEME SYSTEM
  // ============================================================
  function initTheme() {
    const saved = localStorage.getItem('net_theme');
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.setAttribute('data-theme', 'dark');
      dom.themeIcon.className = 'fas fa-sun';
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      dom.themeIcon.className = 'fas fa-moon';
    }
  }

  function toggleTheme() {
    const html = document.documentElement;
    const isDark = html.getAttribute('data-theme') === 'dark';
    const next = isDark ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('net_theme', next);
    dom.themeIcon.className = isDark ? 'fas fa-moon' : 'fas fa-sun';
  }

  // ============================================================
  // UUID GENERATION
  // ============================================================
  function generateUUID() {
    return 'NET-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
  }

  // ============================================================
  // TOAST NOTIFICATIONS
  // ============================================================
  function showToast(message, type = 'info', duration = 5000, actions = null) {
    const icons = {
      success: 'fa-check-circle',
      error: 'fa-exclamation-circle',
      warning: 'fa-exclamation-triangle',
      info: 'fa-info-circle',
    };
    const titles = {
      success: 'تم بنجاح',
      error: 'خطأ',
      warning: 'تنبيه',
      info: 'إشعار',
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <div class="toast-icon"><i class="fas ${icons[type] || icons.info}"></i></div>
      <div class="toast-content">
        <div class="toast-title">${titles[type] || 'إشعار'}</div>
        <div class="toast-message">${message}</div>
        ${actions ? `<div class="toast-actions">${actions}</div>` : ''}
      </div>
      <button class="toast-close" aria-label="إغلاق"><i class="fas fa-times"></i></button>
    `;

    dom.toastContainer.appendChild(toast);

    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => removeToast(toast));

    if (duration > 0) {
      setTimeout(() => removeToast(toast), duration);
    }

    return toast;
  }

  function removeToast(toast) {
    if (toast.classList.contains('removing')) return;
    toast.classList.add('removing');
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }

  // ============================================================
  // SIMULATE WEBSOCKET NOTIFICATIONS
  // ============================================================
  function simulateWebSocket() {
    function randomNotification() {
      const name = BUYER_NAMES[Math.floor(Math.random() * BUYER_NAMES.length)];
      const pkg = PACKAGES[Math.floor(Math.random() * PACKAGES.length)];
      showToast(
        `${name} قام بشراء باقة ${pkg} عبر المحفظة الإلكترونية`,
        'info',
        6000
      );
    }

    // First notification after 8 seconds
    setTimeout(function scheduleNext() {
      randomNotification();
      const delay = 15000 + Math.random() * 15000; // 15-30 seconds
      setTimeout(scheduleNext, delay);
    }, 8000);
  }

  // ============================================================
  // FORMAT HELPERS
  // ============================================================
  function formatNumber(num) {
    return num.toLocaleString('en-US');
  }

  function formatCurrency(num) {
    return num.toLocaleString('en-US');
  }

  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' بايت';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' كيلوبايت';
    return (bytes / (1024 * 1024)).toFixed(1) + ' ميجابايت';
  }

  function getTimeNow() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return hours >= 12 ? `${hours - 12 || 12}:${minutes} م` : `${hours}:${minutes} ص`;
  }

  function getDateNow() {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }

  function getRelativeTime(timestamp) {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return 'منذ لحظات';
    if (diff < 3600000) return `منذ ${Math.floor(diff / 60000)} دقيقة`;
    if (diff < 86400000) return `منذ ${Math.floor(diff / 3600000)} ساعة`;
    return `منذ ${Math.floor(diff / 86400000)} يوم`;
  }

  // ============================================================
  // KPI ANIMATION
  // ============================================================
  function animateKPI() {
    // Set trend indicators
    dom.kpiCardTrends.cards.textContent = MOCK_KPI.cards.trend;
    dom.kpiCardTrends.income.textContent = MOCK_KPI.income.trend;
    dom.kpiCardTrends.last.textContent = MOCK_KPI.last.trend;
    dom.kpiCardTrends.subs.textContent = MOCK_KPI.subs.trend;

    const kpiValues = $$('.kpi-value');
    animateValue(kpiValues[0], 0, MOCK_KPI.cards.value, 1200);
    animateValue(kpiValues[1], 0, MOCK_KPI.income.value, 1200, true);
    kpiValues[2].textContent = MOCK_KPI.last.value;
    animateValue(kpiValues[3], 0, MOCK_KPI.subs.value, 1200);
  }

  function animateValue(el, start, end, duration, isCurrency = false) {
    const startTime = performance.now();
    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * eased);
      el.textContent = isCurrency ? formatCurrency(current) : formatNumber(current);
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  function updateWalletAndProgress() {
    // Removed: wallet and progress cards deleted from UI
  }

  // ============================================================
  // OPERATIONS TABLE
  // ============================================================
  function renderOperations() {
    dom.opsBody.innerHTML = state.operations
      .map(
        (op) => {
          const value = parseInt(op.pkg) * op.count;
          return `
      <tr class="new-row">
        <td><code>${op.id}</code></td>
        <td><strong>${op.pkg}</strong></td>
        <td>${formatNumber(op.count)}</td>
        <td>${formatCurrency(value)} ريال</td>
        <td>${op.date}</td>
        <td>${op.time}</td>
      </tr>`;
        }
      )
      .join('');

    dom.opsCount.textContent = `${state.operations.length} عملية`;
  }

  // ============================================================
  // SYSTEM LOGS
  // ============================================================
  function renderLogs() {
    dom.logsContainer.innerHTML = state.logs
      .map(
        (log) => `
      <div class="log-entry new-row">
        <div class="log-icon"><i class="fas ${log.icon || 'fa-info-circle'}"></i></div>
        <div class="log-message">${log.msg}</div>
        <span class="log-time">${log.time}</span>
      </div>`
      )
      .join('');

    dom.logsCount.textContent = `${state.logs.length} سجل`;
  }

  // ============================================================
  // FILE UPLOAD HANDLING
  // ============================================================
  function initFileUpload() {
    const allowedExtensions = ['.csv', '.xlsx', '.pdf'];
    const maxSize = 5 * 1024 * 1024;

    function validateFile(file) {
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      if (!allowedExtensions.includes(ext)) {
        return { valid: false, error: 'عذراً، الملف المرفوع تالف أو لا يطابق الصيغ المدعومة (CSV, XLSX, PDF)' };
      }
      if (file.size > maxSize) {
        return { valid: false, error: 'حجم الملف يتجاوز 5 ميجابايت. الرجاء اختيار ملف أصغر.' };
      }
      return { valid: true };
    }

    function handleFile(file) {
      const result = validateFile(file);
      if (!result.valid) {
        state.selectedFile = null;
        showFileError(result.error);
        hideFileInfo();
        dom.fileUploadZone.classList.add('has-error');
        disableSubmit(true);
        return;
      }

      state.selectedFile = file;
      dom.fileUploadZone.classList.remove('has-error');
      hideFileError();
      showFileInfo(file.name, file.size);
      disableSubmit(false);
    }

    function removeFile() {
      state.selectedFile = null;
      dom.fileInput.value = '';
      hideFileInfo();
      dom.fileUploadZone.classList.remove('has-error');
      hideFileError();
      disableSubmit(true);
    }

    // Click to upload
    dom.fileUploadZone.addEventListener('click', () => dom.fileInput.click());

    dom.fileInput.addEventListener('change', () => {
      if (dom.fileInput.files.length > 0) {
        handleFile(dom.fileInput.files[0]);
      }
    });

    // Drag and drop
    dom.fileUploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dom.fileUploadZone.classList.add('drag-over');
    });

    dom.fileUploadZone.addEventListener('dragleave', () => {
      dom.fileUploadZone.classList.remove('drag-over');
    });

    dom.fileUploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dom.fileUploadZone.classList.remove('drag-over');
      if (e.dataTransfer.files.length > 0) {
        handleFile(e.dataTransfer.files[0]);
      }
    });

    // Remove file
    dom.fileRemove.addEventListener('click', (e) => {
      e.stopPropagation();
      removeFile();
    });

    // Helper functions
    function showFileInfo(name, size) {
      dom.fileInfo.hidden = false;
      dom.fileName.textContent = name;
      dom.fileSize.textContent = formatFileSize(size);
    }

    function hideFileInfo() {
      dom.fileInfo.hidden = true;
    }

    function showFileError(msg) {
      dom.fileError.textContent = msg;
      dom.fileError.classList.add('visible');
    }

    function hideFileError() {
      dom.fileError.textContent = '';
      dom.fileError.classList.remove('visible');
    }

    function disableSubmit(disabled) {
      dom.submitBtn.disabled = disabled;
    }
  }

  // ============================================================
  // FORM: EXPAND / COLLAPSE
  // ============================================================
  function toggleForm(expand) {
    if (expand === undefined) {
      expand = !dom.formWrapper.classList.contains('expanded');
    }

    if (expand) {
      dom.formWrapper.classList.add('expanded');
      dom.operationId.value = generateUUID();
      dom.toggleFormBtn.innerHTML = '<i class="fas fa-minus-circle"></i><span>إلغاء</span>';
    } else {
      dom.formWrapper.classList.remove('expanded');
      dom.toggleFormBtn.innerHTML = '<i class="fas fa-plus-circle"></i><span>ارسل الآن</span>';
      resetForm();
    }
  }

  function resetForm() {
    dom.form.reset();
    dom.operationId.value = '';
    dom.packageRadios.forEach((r) => { r.checked = false; });
    dom.customPkgWrap.hidden = true;
    dom.customPkgValue.value = '';
    dom.customPkgValue.classList.remove('error');
    state.selectedFile = null;
    dom.fileInput.value = '';
    dom.fileInfo.hidden = true;
    dom.fileUploadZone.classList.remove('has-error');
    hideAllErrors();
    dom.submitBtn.disabled = true;
    dom.submitBtn.querySelector('.btn-text').hidden = false;
    dom.submitBtn.querySelector('.btn-loader').hidden = true;
    state.isSubmitting = false;
    state.retryData = null;
  }

  function hideAllErrors() {
    $$('.field-error').forEach((el) => {
      el.textContent = '';
      el.classList.remove('visible');
    });
    $$('.form-control.error').forEach((el) => el.classList.remove('error'));
  }

  // ============================================================
  // FORM VALIDATION
  // ============================================================
  function getSelectedPackage() {
    const checked = dom.packageGrid.querySelector('input:checked');
    if (!checked) return '';
    if (checked.value === 'custom') return dom.customPkgValue.value.trim() || '';
    return checked.value;
  }

  function validateForm() {
    let isValid = true;
    hideAllErrors();

    // Package class (radio buttons + custom)
    const checkedRadio = dom.packageGrid.querySelector('input:checked');
    if (!checkedRadio) {
      dom.packageError.textContent = 'يرجى اختيار فئة الباقة';
      dom.packageError.classList.add('visible');
      isValid = false;
    } else if (checkedRadio.value === 'custom') {
      const customVal = dom.customPkgValue.value.trim();
      if (!customVal || isNaN(parseInt(customVal, 10)) || parseInt(customVal, 10) < 1) {
        dom.packageError.textContent = 'يرجى إدخال قيمة صالحة للباقة المخصصة';
        dom.packageError.classList.add('visible');
        dom.customPkgValue.classList.add('error');
        isValid = false;
      }
    }

    // Card count
    const count = parseInt(dom.cardCount.value, 10);
    if (!dom.cardCount.value || isNaN(count)) {
      dom.countError.textContent = 'يرجى إدخال عدد الكروت';
      dom.countError.classList.add('visible');
      dom.cardCount.classList.add('error');
      isValid = false;
    } else if (!Number.isInteger(count) || count < 1) {
      dom.countError.textContent = 'الحد الأدنى لعدد الكروت هو 1';
      dom.countError.classList.add('visible');
      dom.cardCount.classList.add('error');
      isValid = false;
    } else if (count > 5000) {
      dom.countError.textContent = 'الحد الأقصى لعدد الكروت هو 5000 كرت للدفعة';
      dom.countError.classList.add('visible');
      dom.cardCount.classList.add('error');
      isValid = false;
    }

    // File
    if (!state.selectedFile) {
      dom.fileError.textContent = 'يرجى رفع ملف الكروت';
      dom.fileError.classList.add('visible');
      dom.fileUploadZone.classList.add('has-error');
      isValid = false;
    }

    return isValid;
  }

  // ============================================================
  // FORM SUBMISSION
  // ============================================================
  function handleSubmit(e) {
    e.preventDefault();

    // Prevent double submission
    if (state.isSubmitting) return;

    // Validate
    if (!validateForm()) return;

    // Check duplicate ID (Idempotency Key)
    const opId = dom.operationId.value;
    if (state.submittedIds.has(opId)) {
      showToast('رقم العملية ' + opId + ' موجود مسبقاً. يتم منع تكرار الإرسال.', 'error', 7000);
      return;
    }

    state.isSubmitting = true;

    // Show loading
    dom.submitBtn.disabled = true;
    dom.btnText.hidden = true;
    dom.btnLoader.hidden = false;

    // Simulate API call
    state.retryData = {
      pkg: getSelectedPackage(),
      count: parseInt(dom.cardCount.value, 10),
      file: state.selectedFile,
    };

    simulateSubmit(opId);
  }

  function simulateSubmit(opId) {
    const delay = 1500 + Math.random() * 1500;

    setTimeout(() => {
      // Simulate network failure (25% chance)
      if (Math.random() < 0.25) {
        handleNetworkFailure(opId);
        return;
      }

      // Success
      handleSuccess(opId);
    }, delay);
  }

  function handleSuccess(opId) {
    const pkg = getSelectedPackage();
    const count = parseInt(dom.cardCount.value, 10);

    // Mark as submitted
    state.submittedIds.add(opId);

    // Add to operations
    state.operations.unshift({
      id: opId,
      pkg: pkg,
      count: count,
      date: getDateNow(),
      time: getTimeNow(),
      status: 'success',
    });
    renderOperations();

    // Add to logs
    const logMsg = `تم إرسال دفعة كروت باقة ${pkg} عدد ${formatNumber(count)} كرت بنجاح`;
    state.logs.unshift({
      msg: logMsg,
      icon: 'fa-box',
      time: getRelativeTime(Date.now()),
    });
    renderLogs();

    // Update KPI (increment)
    const cardsEl = $$('.kpi-value')[0];
    const incomeEl = $$('.kpi-value')[1];
    const currentCards = parseInt(cardsEl.textContent.replace(/,/g, '')) || 0;
    const currentIncome = parseInt(incomeEl.textContent.replace(/,/g, '')) || 0;
    const newCards = currentCards + count;
    const newIncome = currentIncome + count * 15; // Assume 15 EGP per card
    animateValue(cardsEl, currentCards, newCards, 800);
    animateValue(incomeEl, currentIncome, newIncome, 800, true);

    // Hide loading
    dom.submitBtn.disabled = false;
    dom.btnText.hidden = false;
    dom.btnLoader.hidden = true;
    state.isSubmitting = false;

    // Close form
    toggleForm(false);

    // Show success toast
    showToast(
      'تم رفع دفعة الكروت بنجاح، جاري معالجة الطلب وتحديث المحفظة',
      'success',
      6000
    );

    // Simulate wallet update log after a moment
    setTimeout(() => {
      const updateMsg = `تم تحديث رصيد المحفظة بمبلغ ${formatCurrency(count * 15)} ج.م`;
      state.logs.unshift({
        msg: updateMsg,
        icon: 'fa-coins',
        time: getRelativeTime(Date.now()),
      });
      renderLogs();
    }, 3000);
  }

  function handleNetworkFailure(opId) {
    // Show loading state removal
    dom.submitBtn.disabled = false;
    dom.btnText.hidden = false;
    dom.btnLoader.hidden = true;

    // Show network failure toast with retry
    const retryActions = `
      <button class="btn btn-primary btn-sm retry-btn" data-opid="${opId}">
        <i class="fas fa-redo"></i> إعادة المحاولة
      </button>
    `;

    const toast = showToast(
      'فشل الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.',
      'error',
      10000,
      retryActions
    );

    toast.querySelector('.retry-btn').addEventListener('click', () => {
      removeToast(toast);
      retrySubmit(opId);
    });

    // Add failure log
    state.logs.unshift({
      msg: `فشل إرسال دفعة الكروت - انقطاع في الاتصال (العملية: ${opId})`,
      icon: 'fa-exclamation-triangle',
      time: 'الآن',
    });
    renderLogs();

    state.isSubmitting = false;
  }

  function retrySubmit(opId) {
    if (state.isSubmitting) return;
    state.isSubmitting = true;

    dom.submitBtn.disabled = true;
    dom.btnText.hidden = true;
    dom.btnLoader.hidden = false;

    // Shorter delay for retry
    setTimeout(() => {
      if (Math.random() < 0.15) { // Lower failure chance on retry
        handleNetworkFailure(opId);
        showToast('فشلت إعادة المحاولة أيضاً. يرجى المحاولة لاحقاً.', 'error', 5000);
        return;
      }
      handleSuccess(opId);
    }, 1000 + Math.random() * 1000);
  }

  // ============================================================
  // CHART (Chart.js)
  // ============================================================
  function initChart() {
    const ctx = dom.chartCanvas.getContext('2d');

    const weekData = {
      labels: ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'],
      income: [12000, 19000, 15000, 22000, 18000, 25000, 21000],
      cards: [320, 450, 380, 520, 410, 580, 490],
    };

    const monthData = {
      labels: Array.from({ length: 30 }, (_, i) => `${i + 1}`),
      income: Array.from({ length: 30 }, () => Math.floor(8000 + Math.random() * 22000)),
      cards: Array.from({ length: 30 }, () => Math.floor(200 + Math.random() * 500)),
    };

    const yearData = {
      labels: ['يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
      income: [180000, 210000, 195000, 240000, 220000, 260000, 280000, 250000, 230000, 270000, 290000, 310000],
      cards: [4500, 5200, 4800, 5800, 5400, 6200, 6500, 6000, 5600, 6400, 6800, 7200],
    };

    function getColors() {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      return {
        primary: isDark ? '#3b82f6' : '#2563eb',
        primaryAlpha: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(37, 99, 235, 0.12)',
        success: isDark ? '#10b981' : '#059669',
        successAlpha: isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(5, 150, 105, 0.12)',
        grid: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        text: isDark ? '#94a3b8' : '#64748b',
      };
    }

    function buildChart(data, chartType) {
      if (state.chartInstance) state.chartInstance.destroy();

      const colors = getColors();
      const isMobile = window.innerWidth <= 480;
      const axisFontSize = isMobile ? 8 : 10;

      state.chartType = chartType || 'line';
      const isBar = state.chartType === 'bar';
      state.chartInstance = new Chart(ctx, {
        type: state.chartType,
        data: {
          labels: data.labels,
          datasets: [
            {
              label: 'الدخل (ج.م)',
              data: data.income,
              borderColor: colors.primary,
              backgroundColor: (ctx) => {
                const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 300);
                if (isBar) {
                  gradient.addColorStop(0, colors.primary);
                  gradient.addColorStop(1, colors.primaryAlpha);
                } else {
                  gradient.addColorStop(0, colors.primaryAlpha);
                  gradient.addColorStop(1, 'transparent');
                }
                return gradient;
              },
              fill: !isBar,
              tension: 0.4,
              pointBackgroundColor: colors.primary,
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
              pointRadius: isBar ? 0 : 4,
              pointHoverRadius: isBar ? 0 : 6,
              borderWidth: isBar ? 1 : 2.5,
              borderRadius: isBar ? { topLeft: 6, topRight: 6, bottomLeft: 0, bottomRight: 0 } : 0,
              borderSkipped: isBar ? 'bottom' : false,
              maxBarThickness: isMobile ? 12 : 24,
              barPercentage: 0.65,
              categoryPercentage: 0.8,
            },
            {
              label: 'الكروت المباعة',
              data: data.cards,
              borderColor: colors.success,
              backgroundColor: (ctx) => {
                const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 300);
                if (isBar) {
                  gradient.addColorStop(0, colors.success);
                  gradient.addColorStop(1, colors.successAlpha);
                } else {
                  gradient.addColorStop(0, colors.successAlpha);
                  gradient.addColorStop(1, 'transparent');
                }
                return gradient;
              },
              fill: !isBar,
              tension: 0.4,
              pointBackgroundColor: colors.success,
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
              pointRadius: isBar ? 0 : 4,
              pointHoverRadius: isBar ? 0 : 6,
              borderWidth: isBar ? 1 : 2.5,
              borderRadius: isBar ? { topLeft: 6, topRight: 6, bottomLeft: 0, bottomRight: 0 } : 0,
              borderSkipped: isBar ? 'bottom' : false,
              maxBarThickness: isMobile ? 12 : 24,
              barPercentage: 0.65,
              categoryPercentage: 0.8,
              yAxisID: 'y1',
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            intersect: false,
            mode: 'index',
          },
          plugins: {
            legend: {
              position: 'top',
              align: 'end',
              labels: {
                font: { family: 'Tajawal', size: 11 },
                color: colors.text,
                usePointStyle: true,
                padding: 16,
              },
            },
            tooltip: {
              backgroundColor: document.documentElement.getAttribute('data-theme') === 'dark' ? '#1e293b' : '#ffffff',
              titleColor: document.documentElement.getAttribute('data-theme') === 'dark' ? '#f1f5f9' : '#0f172a',
              bodyColor: document.documentElement.getAttribute('data-theme') === 'dark' ? '#94a3b8' : '#475569',
              borderColor: document.documentElement.getAttribute('data-theme') === 'dark' ? '#334155' : '#e2e8f0',
              borderWidth: 1,
              padding: 12,
              cornerRadius: 8,
              titleFont: { family: 'Tajawal', size: 12 },
              bodyFont: { family: 'Tajawal', size: 11 },
            },
          },
          scales: {
            x: {
              grid: { color: colors.grid, drawBorder: false },
              ticks: {
                font: { family: 'Tajawal', size: axisFontSize },
                color: colors.text,
              },
            },
            y: {
              position: 'right',
              grid: { color: colors.grid, drawBorder: false },
              ticks: {
                font: { family: 'Tajawal', size: axisFontSize },
                color: colors.text,
                callback: (val) => val.toLocaleString('ar-EG'),
              },
            },
            y1: {
              position: 'left',
              grid: { display: false },
              ticks: {
                font: { family: 'Tajawal', size: axisFontSize },
                color: colors.text,
                callback: (val) => val.toLocaleString('ar-EG'),
              },
            },
          },
        },
      });
    }

    function getCurrentData() {
      const activeTab = document.querySelector('.chart-tab.active');
      const period = activeTab?.dataset?.period || 'week';
      return period === 'week' ? weekData : period === 'month' ? monthData : yearData;
    }

    function rebuildChart() {
      const ct = document.querySelector('.view-tab.active')?.dataset?.view || 'line';
      buildChart(getCurrentData(), ct);
    }

    // Initial chart
    buildChart(weekData, 'line');

    // Period tab switching
    dom.chartTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        dom.chartTabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        rebuildChart();
      });
    });

    // View tab switching (line / bar)
    dom.viewTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        dom.viewTabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        rebuildChart();
      });
    });

    // Expose for theme change
    window.__chartData = { weekData, monthData, yearData };
    window.__buildChart = rebuildChart;
  }

  // ============================================================
  // MOBILE MENU
  // ============================================================
  function initMobileMenu() {
    dom.mobileMenuBtn.addEventListener('click', () => {
      dom.topbarNav.classList.toggle('open');
    });

    // Close on nav link click
    $$('.nav-link').forEach((link) => {
      link.addEventListener('click', () => {
        dom.topbarNav.classList.remove('open');
      });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.topbar')) {
        dom.topbarNav.classList.remove('open');
      }
    });
  }

  // ============================================================
  // THEME CHANGE REINIT (for chart colors)
  // ============================================================
  function reinitChartOnThemeChange() {
    const observer = new MutationObserver(() => {
      if (window.__buildChart) {
        window.__buildChart();
      }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }

  // ============================================================
  // NOTIFICATION BELL CLICK
  // ============================================================
  function initNotificationBell() {
    dom.notifBtn.addEventListener('click', () => {
      showToast('لا توجد إشعارات جديدة حالياً', 'info', 3000);
    });
  }

  // ============================================================
  // INITIALIZATION
  // ============================================================
  function init() {
    cacheDom();

    // Theme
    initTheme();
    dom.themeToggle.addEventListener('click', toggleTheme);

    // Render initial data
    renderOperations();
    renderLogs();

    // Animate KPIs
    animateKPI();
    updateWalletAndProgress();

    // File upload
    initFileUpload();

    // Form toggle
    dom.toggleFormBtn.addEventListener('click', () => toggleForm());
    dom.cancelBtn.addEventListener('click', () => toggleForm(false));

    // Custom package radio handler
    dom.packageRadios.forEach((r) => {
      r.addEventListener('change', () => {
        if (r.value === 'custom' && r.checked) {
          dom.customPkgWrap.hidden = false;
          dom.customPkgValue.focus();
        } else {
          dom.customPkgWrap.hidden = true;
          dom.customPkgValue.classList.remove('error');
        }
        dom.packageError.classList.remove('visible');
        dom.packageError.textContent = '';
      });
    });
    dom.customPkgValue.addEventListener('input', () => {
      dom.customPkgValue.classList.remove('error');
    });

    // Form submit
    dom.form.addEventListener('submit', handleSubmit);

    // Chart
    if (typeof Chart !== 'undefined') {
      initChart();
      reinitChartOnThemeChange();
    }

    // Mobile menu
    initMobileMenu();

    // Notification bell
    initNotificationBell();

    // Refresh table
    dom.refreshTableBtn.addEventListener('click', () => {
      renderOperations();
      showToast('تم تحديث جدول العمليات', 'success', 3000);
    });

    // Simulate WebSocket notifications
    simulateWebSocket();
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
