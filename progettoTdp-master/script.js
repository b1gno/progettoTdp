document.addEventListener('DOMContentLoaded', () => {
    
    // Aggiungi effetto hover avanzato per le card
    const cards = document.querySelectorAll('.product-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.boxShadow = '0 10px 20px rgba(0,0,0,0.2)';
        });
        card.addEventListener('mouseleave', () => {
            card.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
        });
    });
});