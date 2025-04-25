(function () {
    const startTime = performance.now();

    window.addEventListener('load', () => {
        const endTime = performance.now();
        const loadTime = endTime - startTime;

        const loadTimeElement = document.getElementById('loadTime');
        loadTimeElement.textContent = loadTime.toFixed(2) + 'ms';
    });
})();