let p = window.location.pathname.includes('/daily/') || 
window.location.pathname.includes('/unlimited/') ||
window.location.pathname.includes('/info/') ? '../' : '';
document.write(`
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dokkanle!</title>
    <link rel="stylesheet" href="${p}styles.css?v=2.2">
    `);