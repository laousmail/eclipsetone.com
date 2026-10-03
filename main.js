(() => {
  const nodes = document.querySelectorAll('.reveal')
  if (!('IntersectionObserver' in window) || !nodes.length) {
    nodes.forEach((node) => node.classList.add('in'))
    return
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in')
          observer.unobserve(entry.target)
        }
      }
    },
    { threshold: 0.18, rootMargin: '0px 0px -8% 0px' },
  )

  nodes.forEach((node) => observer.observe(node))
})()
