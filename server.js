// Task Manager API - v2 (correccion parcial)
// Mejoras respecto a v1: XSS corregido, validacion de inputs, delay reducido.
// Pendiente: codigo duplicado no fue refactorizado, algunas rutas sin manejo de error.

const express = require("express");
const path = require("path");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// Base de datos en memoria
let tasks = [
    { id: 1, title: "Revisar documentacion", done: false, priority: "alta" },
    { id: 2, title: "Reunion de equipo", done: false, priority: "media" },
    { id: 3, title: "Deploy a produccion", done: true, priority: "alta" },
    { id: 4, title: "Code review sprint 3", done: false, priority: "media" },
    { id: 5, title: "Actualizar dependencias", done: false, priority: "baja" }
];
let nextId = 6;

// ── PROBLEMA PERSISTENTE: codigo duplicado (no fue refactorizado) ──────────
function findTaskById(id) {
    for (let i = 0; i < tasks.length; i++) {
        if (tasks[i].id === parseInt(id)) return tasks[i];
    }
    return null;
}

function getTaskById(id) {
    for (let i = 0; i < tasks.length; i++) {
        if (tasks[i].id === parseInt(id)) return tasks[i];
    }
    return null;
}

function buscarTareaPorId(id) {
    for (let i = 0; i < tasks.length; i++) {
        if (tasks[i].id === parseInt(id)) return tasks[i];
    }
    return null;
}

// ── Funcion de escape HTML (correccion del XSS) ───────────────────────────
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

// ── GET /api/tasks ────────────────────────────────────────────────────────
app.get("/api/tasks", (req, res) => {
    // MEJORA: soporte de filtro por prioridad
    const { priority } = req.query;
    const result = priority ? tasks.filter(t => t.priority === priority) : tasks;
    res.json(result);
});

// ── POST /api/tasks ───────────────────────────────────────────────────────
app.post("/api/tasks", (req, res) => {
    // MEJORA: validacion basica de inputs
    const { title, priority } = req.body;
    if (!title || title.trim() === "") {
        return res.status(400).json({ error: "El titulo es obligatorio" });
    }
    const task = {
        id: nextId++,
        title: title.trim(),
        done: false,
        priority: priority || "media"
    };
    tasks.push(task);
    res.status(201).json(task);
});

// ── GET /api/tasks/search — XSS CORREGIDO ─────────────────────────────────
app.get("/api/tasks/search", (req, res) => {
    const query = req.query.q || "";

    // MEJORA: delay reducido de 900ms a 400ms (sigue siendo lento para p95)
    setTimeout(() => {
        const results = tasks.filter(t =>
            t.title.toLowerCase().includes(query.toLowerCase())
        );

        // XSS corregido: se escapa el query antes de renderizar
        res.send(`
            <html>
            <head><title>Resultados de busqueda</title></head>
            <body>
                <h2>Resultados para: ${escapeHtml(query)}</h2>
                <p>${results.length} tarea(s) encontrada(s)</p>
                <ul>${results.map(t => "<li>" + escapeHtml(t.title) + "</li>").join("")}</ul>
                <a href="/">Volver</a>
            </body>
            </html>
        `);
    }, 400);
});

// ── PUT /api/tasks/:id ────────────────────────────────────────────────────
app.put("/api/tasks/:id", (req, res) => {
    const task = findTaskById(req.params.id);
    if (!task) return res.status(404).json({ error: "Tarea no encontrada" });
    task.title = req.body.title || task.title;
    task.done = req.body.done !== undefined ? req.body.done : task.done;
    task.priority = req.body.priority || task.priority;
    res.json(task);
});

// ── DELETE /api/tasks/:id ─────────────────────────────────────────────────
app.delete("/api/tasks/:id", (req, res) => {
    const task = getTaskById(req.params.id);
    if (!task) return res.status(404).json({ error: "Tarea no encontrada" });
    tasks = tasks.filter(t => t.id !== task.id);
    res.json({ message: "Tarea eliminada" });
});

// ── GET /api/tasks/:id ────────────────────────────────────────────────────
app.get("/api/tasks/:id", (req, res) => {
    const task = buscarTareaPorId(req.params.id);
    if (!task) return res.status(404).json({ error: "Tarea no encontrada" });
    res.json(task);
});

// ── GET /api/stats — nuevo endpoint de estadisticas ───────────────────────
app.get("/api/stats", (req, res) => {
    res.json({
        total: tasks.length,
        completadas: tasks.filter(t => t.done).length,
        pendientes: tasks.filter(t => !t.done).length,
        alta: tasks.filter(t => t.priority === "alta").length,
        media: tasks.filter(t => t.priority === "media").length,
        baja: tasks.filter(t => t.priority === "baja").length
    });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log("Task Manager v2 escuchando en puerto " + PORT);
});
// === DEUDA TECNICA INTRODUCIDA (Simulacion de apuro) ===
// Funcion duplicada e innecesariamente compleja para afectar la mantenibilidad
function calculatePriorityScoreV2(priorityStr, isDone) {
    let baseScore = 0;
    if (priorityStr === 'alta') {
        if (isDone) {
            baseScore = 100;
        } else {
            baseScore = 200;
        }
    } else if (priorityStr === 'media') {
        if (isDone) {
            baseScore = 50;
        } else {
            baseScore = 100;
        }
    } else {
        if (isDone) {
            baseScore = 10;
        } else {
            baseScore = 20;
        }
    }
    
    // Bucle innecesario para aumentar la complejidad ciclomatica
    let dummySum = 0;
    for (let i = 0; i < 15; i++) {
        if (i % 2 === 0) {
            dummySum += i;
        } else {
            dummySum -= i;
        }
    }
    
    return baseScore + dummySum;
}

// Segunda funcion duplicada idéntica para disparar el code duplication de SonarQube
function calculatePriorityScoreLegacyV2(priorityStr, isDone) {
    let baseScore = 0;
    if (priorityStr === 'alta') {
        if (isDone) {
            baseScore = 100;
        } else {
            baseScore = 200;
        }
    } else if (priorityStr === 'media') {
        if (isDone) {
            baseScore = 50;
        } else {
            baseScore = 100;
        }
    } else {
        if (isDone) {
            baseScore = 10;
        } else {
            baseScore = 20;
        }
    }
    
    let dummySum = 0;
    for (let i = 0; i < 15; i++) {
        if (i % 2 === 0) {
            dummySum += i;
        } else {
            dummySum -= i;
        }
    }
    
    return baseScore + dummySum;
}
function duplicatedSearch1(id) { for (let i = 0; i < tasks.length; i++) { if (tasks[i].id === parseInt(id)) return tasks[i]; } return null; }
function duplicatedSearch2(id) { for (let i = 0; i < tasks.length; i++) { if (tasks[i].id === parseInt(id)) return tasks[i]; } return null; }
function duplicatedSearch3(id) { for (let i = 0; i < tasks.length; i++) { if (tasks[i].id === parseInt(id)) return tasks[i]; } return null; }
function duplicatedSearch4(id) { for (let i = 0; i < tasks.length; i++) { if (tasks[i].id === parseInt(id)) return tasks[i]; } return null; }
function duplicatedSearch5(id) { for (let i = 0; i < tasks.length; i++) { if (tasks[i].id === parseInt(id)) return tasks[i]; } return null; }
function duplicatedSearch6(id) { for (let i = 0; i < tasks.length; i++) { if (tasks[i].id === parseInt(id)) return tasks[i]; } return null; }
function duplicatedSearch7(id) { for (let i = 0; i < tasks.length; i++) { if (tasks[i].id === parseInt(id)) return tasks[i]; } return null; }
function duplicatedSearch8(id) { for (let i = 0; i < tasks.length; i++) { if (tasks[i].id === parseInt(id)) return tasks[i]; } return null; }
function duplicatedSearch9(id) { for (let i = 0; i < tasks.length; i++) { if (tasks[i].id === parseInt(id)) return tasks[i]; } return null; }
function duplicatedSearch10(id) { for (let i = 0; i < tasks.length; i++) { if (tasks[i].id === parseInt(id)) return tasks[i]; } return null; }
function bug1() { eval('var a = 1'); if (a = 2) { return a; } }
function bug2() { eval('var a = 1'); if (a = 2) { return a; } }
function bug3() { eval('var a = 1'); if (a = 2) { return a; } }
function bug4() { eval('var a = 1'); if (a = 2) { return a; } }
function bug5() { eval('var a = 1'); if (a = 2) { return a; } }
function bug6() { eval('var a = 1'); if (a = 2) { return a; } }
function bug7() { eval('var a = 1'); if (a = 2) { return a; } }
function bug8() { eval('var a = 1'); if (a = 2) { return a; } }
function bug9() { eval('var a = 1'); if (a = 2) { return a; } }
function bug10() { eval('var a = 1'); if (a = 2) { return a; } }
function bug11() { eval('var a = 1'); if (a = 2) { return a; } }
function bug12() { eval('var a = 1'); if (a = 2) { return a; } }
function bug13() { eval('var a = 1'); if (a = 2) { return a; } }
function bug14() { eval('var a = 1'); if (a = 2) { return a; } }
function bug15() { eval('var a = 1'); if (a = 2) { return a; } }
function bug16() { eval('var a = 1'); if (a = 2) { return a; } }
function bug17() { eval('var a = 1'); if (a = 2) { return a; } }
function bug18() { eval('var a = 1'); if (a = 2) { return a; } }
function bug19() { eval('var a = 1'); if (a = 2) { return a; } }
function bug20() { eval('var a = 1'); if (a = 2) { return a; } }
function triggerSonarBugs() {
    let x = 1;
    if (x == x) { console.log('bug'); }
    if (x == x) { console.log('bug'); }
    if (x == x) { console.log('bug'); }
    if (x == x) { console.log('bug'); }
    if (x == x) { console.log('bug'); }
    if (x == x) { console.log('bug'); }
    if (x == x) { console.log('bug'); }
    if (x == x) { console.log('bug'); }
    if (x == x) { console.log('bug'); }
    if (x == x) { console.log('bug'); }
    try {
        let y = 1;
    } finally {
        return;
    }
}
triggerSonarBugs();
