document.addEventListener("DOMContentLoaded", () => {
    const expenseForm = document.getElementById("expenseForm");
    const viewMonthSelect = document.getElementById('viewMonth');
    const expensesList = document.getElementById('expensesList');
    const currentMonth = document.getElementById('currentMonth');
    const totalAmount = document.getElementById('totalAmount');

    expenseForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = new FormData(expenseForm);
        const payload = {
            month: formData.get("month"),
            type: formData.get("type"),
            amount: formData.get("amount")
        };

        /*Basic validation
        if(){

        }*/

        try {
            const res = await fetch("api.php?action=add", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!data.success) {
                alert("Error" + (data.message || "unknown"));
                return;
            }

            document.getElementById("amountInput").value = "";
            const viewing = viewMonthSelect.value;

            if (viewing === payload.month) {
                loadExpenses(viewing);
            } else {
                // set the view month to the one just saved and load
                viewMonthSelect.value = payload.month;
                loadExpenses(payload.month);
            }

        } catch (err) {
            console.log(err);
            alert("Network error" + err);
        }


    });


    async function loadExpenses(month) {

        currentMonth.textContent = month || '—';
        expensesList.innerHTML = '<li>Loading…</li>';
        totalAmount.textContent = '0.00';

        try {
            const res = await fetch('api.php?action=list&month=' + encodeURIComponent(month || ''));
            const data = await res.json();

            if (!data.success) {
                expensesList.innerHTML = `<li>${data.message || 'Error'}</li>`;
                return;
            }
            const items = data.items || [];
            if (items.length === 0) {
                expensesList.innerHTML = '<li>No expenses for this month.</li>';
                totalAmount.textContent = '0.00';
                return;
            }

            expensesList.innerHTML = '';
            let total = 0;
            items.forEach(it => {
                const li = document.createElement('li');
                const leftDiv = document.createElement('div');
                leftDiv.innerHTML = `<div><strong>${escapeHtml(it.expense_type)}</strong></div>
                             <div class="expense-meta">${it.created_at}</div>`;
                const rightDiv = document.createElement('div');
                rightDiv.innerHTML = `<div>${parseFloat(it.amount).toFixed(2)} €</div>
                              <button data-id="${it.id}" class="delBtn">Delete</button>`;
                rightDiv.style.textAlign = 'right';
                li.appendChild(leftDiv);
                li.appendChild(rightDiv);
                expensesList.appendChild(li);
                total += parseFloat(it.amount);
            });
            totalAmount.textContent = total.toFixed(2);




        } catch (err) {
            expensesList.innerHTML = `<li>Error loading expenses</li>`;
            console.error(err);
        }
    }

    // Delete expense (delegation)
    expensesList.addEventListener('click', async (ev) => {
        if (ev.target.classList.contains('delBtn')) {
            const id = ev.target.dataset.id;
            console.log(id);
            if (!confirm('Delete this expense?')) return;
            try {
                const res = await fetch('api.php?action=delete', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        id
                    })
                });
                const data = await res.json();
                if (data.success) {
                    loadExpenses(viewMonthSelect.value || '');
                } else {
                    alert('Delete failed: ' + (data.message || 'unknown'));
                }
            } catch (err) {
                console.error(err);
                alert('Network error while deleting.');
            }
        }
    });



    // Escape HTML to avoid injection in displayed text
    function escapeHtml(s) {
        if (!s) return '';
        return s.replace(/[&<>"']/g, c => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": "&#39;"
        } [c]));
    }

    // When user changes month to view
    viewMonthSelect.addEventListener('change', () => {
        const m = viewMonthSelect.value;
        loadExpenses(m);
    });


});