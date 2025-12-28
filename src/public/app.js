const API = "/api/professors";

async function reload() {
    const res = await fetch(API);
    const data = await res.json();
    const tbody = document.querySelector("#list tbody");
    tbody.innerHTML = "";
    data.forEach(p => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
      <td>${p.id}</td>
      <td>${escapeHtml(p.firstname)}</td>
      <td>${escapeHtml(p.lastname)}</td>
      <td>${escapeHtml(p.email || "")}</td>
      <td>
        <button data-id="${p.id}" class="edit">Bearbeiten</button>
        <button data-id="${p.id}" class="delete">Löschen</button>
      </td>`;
        tbody.appendChild(tr);
    });
}

function escapeHtml(s){ return String(s).replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[m]); }

document.getElementById("reload").addEventListener("click", reload);

document.getElementById("prof-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("prof-id").value;
    const body = {
        first: document.getElementById("first").value,
        last: document.getElementById("last").value,
        email: document.getElementById("email").value
    };
    if (id) {
        const res = await fetch(API + "/" + id, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });
        if (!res.ok) alert("Update fehlgeschlagen");
    } else {
        const res = await fetch(API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });
        if (!res.ok) alert("Erstellen fehlgeschlagen");
    }
    resetForm();
    await reload();
});

document.getElementById("reset").addEventListener("click", resetForm);

function resetForm(){
    document.getElementById("prof-id").value = "";
    document.getElementById("first").value = "";
    document.getElementById("last").value = "";
    document.getElementById("email").value = "";
}

document.querySelector("#list tbody").addEventListener("click", async (e) => {
    if (e.target.classList.contains("edit")) {
        const id = e.target.dataset.id;
        const res = await fetch(API + "/" + id);
        const p = await res.json();
        document.getElementById("prof-id").value = p.id;
        document.getElementById("first").value = p.firstname;
        document.getElementById("last").value = p.lastname;
        document.getElementById("email").value = p.email || "";
    } else if (e.target.classList.contains("delete")) {
        const id = e.target.dataset.id;
        if (!confirm("Wirklich löschen?")) return;
        const res = await fetch(API + "/" + id, { method: "DELETE" });
        if (res.ok) {
            await reload();
        } else {
            alert("Löschen fehlgeschlagen");
        }
    }
});

// initial load
reload();
