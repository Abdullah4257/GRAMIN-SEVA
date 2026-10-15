let members = JSON.parse(localStorage.getItem('gs_members')) || [];
let transactions = JSON.parse(localStorage.getItem('gs_transactions')) || [];

function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.sidebar a').forEach(a => a.classList.remove('active'));
    
    document.getElementById(sectionId).classList.add('active');
    updateDashboard();
}

// সদস্য তৈরি
document.getElementById('member-form')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('member-name').value;
    const phone = document.getElementById('member-phone').value;
    const loan = parseFloat(document.getElementById('member-loan').value);

    const newMember = {
        id: 'GS-' + (members.length + 101),
        name: name,
        phone: phone,
        loan: loan
    };

    members.push(newMember);
    localStorage.setItem('gs_members', JSON.stringify(members));
    alert('সদস্য সফলভাবে যুক্ত করা হয়েছে!');
    this.reset();
    renderMembers();
});

// সদস্য তালিকা রেন্ডার
function renderMembers() {
    const tbody = document.getElementById('members-list');
    if(!tbody) return;
    tbody.innerHTML = '';
    members.forEach(m => {
        tbody.innerHTML += `
            <tr>
                <td>${m.id}</td>
                <td>${m.name}</td>
                <td>${m.phone}</td>
                <td>৳ ${m.loan}</td>
            </tr>
        `;
    });
}

// লেনদেন সংরক্ষণ
document.getElementById('transaction-form')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const member = document.getElementById('trans-member-id').value;
    const type = document.getElementById('trans-type').value;
    const amount = parseFloat(document.getElementById('trans-amount').value);

    const newTrans = {
        date: new Date().toLocaleDateString('bn-BD'),
        member: member,
        type: type,
        amount: amount
    };

    transactions.push(newTrans);
    localStorage.setItem('gs_transactions', JSON.stringify(transactions));
    alert('লেনদেন সংরক্ষিত হয়েছে!');
    this.reset();
});

// ড্যাশবোর্ড আপডেট
function updateDashboard() {
    document.getElementById('total-members-count').innerText = members.length;
    
    let totalLoans = members.reduce((sum, m) => sum + m.loan, 0);
    document.getElementById('total-loans').innerText = '৳ ' + totalLoans;

    let todayColl = transactions
        .filter(t => t.type === 'কিস্তি আদায়' || t.type === 'সঞ্চয় জমা')
        .reduce((sum, t) => sum + t.amount, 0);
    document.getElementById('today-collection').innerText = '৳ ' + todayColl;

    const tbody = document.querySelector('#recent-transactions-table tbody');
    if(tbody) {
        tbody.innerHTML = '';
        transactions.slice(-5).reverse().forEach(t => {
            tbody.innerHTML += `
                <tr>
                    <td>${t.date}</td>
                    <td>${t.member}</td>
                    <td>${t.type}</td>
                    <td>৳ ${t.amount}</td>
                </tr>
            `;
        });
    }
}

// প্রাথমিক রেন্ডার
renderMembers();
updateDashboard();