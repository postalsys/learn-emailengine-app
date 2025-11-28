// Biel AI Chat Widget
// Injects the biel-button custom element into the page

if (typeof window !== 'undefined') {
  const button = document.createElement('biel-button');
  button.setAttribute('project', 'ctd51bpdtp');
  button.setAttribute('header-title', 'Biel.ai Chatbot');
  button.setAttribute('button-position', 'bottom-right');
  button.setAttribute('modal-position', 'sidebar-right');
  button.setAttribute('button-style', 'dark');
  button.textContent = 'Ask AI';
  document.body.appendChild(button);
}
