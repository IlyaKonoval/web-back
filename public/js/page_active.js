const nav = document.querySelector('.nav');
const navLinks = nav.querySelectorAll('a');
const currentURL = window.location.href;
navLinks.forEach(link => {
    if (link.href === currentURL) {
        link.classList.add('active');
    } else {
        link.classList.remove('active');
    }
});
