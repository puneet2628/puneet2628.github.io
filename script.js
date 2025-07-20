document.addEventListener('DOMContentLoaded', () => {

    // =========== THEME SWITCHER ===========
    const themeSwitcher = document.querySelector('.theme-switcher');
    const body = document.body;

    themeSwitcher.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        body.classList.toggle('light-mode');
    });

    // =========== ANIMATED COUNTERS ===========
    const achievementsSection = document.querySelector('.about-achievements');
    const counters = document.querySelectorAll('.achievement-number');
    let animated = false;

    const animateCounters = () => {
        counters.forEach(counter => {
            const target = +counter.getAttribute('data-target');
            const step = target / 200; // Animation speed

            const updateCount = () => {
                const current = +counter.innerText;
                if (current < target) {
                    counter.innerText = `${Math.ceil(current + step)}`;
                    setTimeout(updateCount, 1);
                } else {
                    counter.innerText = target;
                }
            };
            updateCount();
        });
    };

    // Intersection Observer to trigger animation on scroll
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !animated) {
                animateCounters();
                animated = true; // Ensure animation runs only once
            }
        });
    }, {
        threshold: 0.5 // Trigger when 50% of the element is visible
    });

    if (achievementsSection) {
        observer.observe(achievementsSection);
    }
    
    // =========== CONTACT FORM SUBMISSION (FRONT-END ONLY) ===========
    const contactForm = document.querySelector('.contact-form');
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Prevents the default form submission
        // In a real project, you would send this data to a server
        alert('Thank you for your message!');
        contactForm.reset();
    });

});