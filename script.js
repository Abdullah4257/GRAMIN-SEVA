// প্রাথমিক ডাটা লোড
let members = JSON.parse(localStorage.getItem('gs_members')) || [];
let transactions = JSON.parse(localStorage.getItem('gs_transactions')) || [];
let notices = JSON.parse(localStorage.getItem('gs_notices')) || [];

document.addEventListener('DOMContentLoaded', () => {
    updateDashboardStats();
    renderMembersTable();
    populateMemberDropdown();
    renderRecentTransactions();
    renderNotices();
});

// ট্যাবস পরিবর্তন
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');
}

// ১. নতুন সদস্য ভর্তি
function handleRegisterMember(e) {
    e.preventDefault();
    
    const newMember = {
        id: 'GS-' + (1000 + members.length + 1),
        name: document.getElementById('m-name').value,
        guardian: document.getElementById('m-guardian').value,
        phone: document.getElementById('m-phone').value,
        nid: document.getElementById('m-nid').value,
        village: document.getElementById('m-village').value,
        thana: document.getElementById('m-thana').value,
        district: document.getElementById('m-district').value,
        savings: parseFloat(document.getElementById('m-init-savings').value) || 0,
        loan: parseFloat(document.getElementById('m-init-loan').value) || 0,
        status: 'সক্রিয়',
        joinedDate: new Date().toLocaleDateString('bn-BD')
    };

    members.push(newMember);
    localStorage.setItem('gs_members', JSON.stringify(members));

    // প্রাথমিক জমার লেনদেন রেকর্ড
    if(newMember.savings > 0) {
        transactions.push({ memberName: newMember.name, type: 'সঞ্চয় জমা', amount: newMember.savings, date: newMember.joinedDate });
    }
    localStorage.setItem('gs_transactions', JSON.stringify(transactions));

    alert('সদস্য ভর্তি সফল হয়েছে! সদস্য আইডি: ' + newMember.id);
    document.getElementById('member-form').reset();
    
    updateDashboardStats();
    renderMembersTable();
    populateMemberDropdown();
}

// ২. সদস্য তালিকা ও সদস্য বাতিল সুবিধা
function renderMembersTable() {
    const tableBody = document.getElementById('members-list-table');
    const search = document.getElementById('search-member').value.toLowerCase();
    tableBody.innerHTML = '';

    const filtered = members.filter(m => m.name.toLowerCase().includes(search) || m.phone.includes(search));

    if (filtered.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="9" class="text-center">কোনো সদস্য পাওয়া যায়নি</td></tr>';
        return;
    }

    filtered.forEach(m => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><b>${m.id}</b></td>
            <td>${m.name}</td>
            <td>${m.guardian}</td>
            <td>${m.village}, ${m.thana}, ${m.district}</td>
            <td>${m.phone}</td>
            <td>৳ ${m.savings}</td>
            <td>৳ ${m.loan}</td>
            <td><span class="status-badge ${m.status === 'সক্রিয়' ? 'status-active' : 'status-cancelled'}">${m.status}</span></td>
            <td>
                ${m.status === 'সক্রিয়' ? `<button class="btn btn-danger" onclick="toggleMemberStatus('${m.id}')">বাতিল করুন</button>` : `<button class="btn btn-warning" onclick="toggleMemberStatus('${m.id}')">পুনরায় সক্রিয় করুন</button>`}
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// সদস্য বাতিল বা পুনরায় সক্রিয়করণ
function toggleMemberStatus(memberId) {
    const member = members.find(m => m.id === memberId);
    if (member) {
        if(confirm(`আপনি কি সত্যিই ${member.name}-এর সদস্যপদ ${member.status === 'সক্রিয়' ? 'বাতিল' : 'সক্রিয়'} করতে চান?`)) {
            member.status = member.status === 'সক্রিয়' ? 'বাতিলকৃত' : 'সক্রিয়';
            localStorage.setItem('gs_members', JSON.stringify(members));
            renderMembersTable();
            updateDashboardStats();
        }
    }
}

// ৩. সঞ্চয় ও ঋণ লেনদেন
function handleTransaction(e) {
    e.preventDefault();
    const memberId = document.getElementById('txn-member').value;
    const type = document.getElementById('txn-type').value;
    const amount = parseFloat(document.getElementById('txn-amount').value);

    const member = members.find(m => m.id === memberId);
    if (!member) return;

    let txnLabel = '';
    if (type === 'savings_deposit') {
        member.savings += amount;
        txnLabel = 'সঞ্চয় জমা';
    } else if (type === 'savings_withdraw') {
        if(member.savings < amount) return alert('পর্যাপ্ত সঞ্চয় নেই!');
        member.savings -= amount;
        txnLabel = 'সঞ্চয় উত্তোলন';
    } else if (type === 'loan_repay') {
        member.loan = Math.max(0, member.loan - amount);
        txnLabel = 'ঋণের কিস্তি জমা';
    } else if (type === 'loan_disburse') {
        member.loan += amount;
        txnLabel = 'নতুন ঋণ প্রদান';
    }

    transactions.push({
        memberName: member.name,
        type: txnLabel,
        amount: amount,
        date: new Date().toLocaleDateString('bn-BD')
    });

    localStorage.setItem('gs_members', JSON.stringify(members));
    localStorage.setItem('gs_transactions', JSON.stringify(transactions));

    alert('লেনদেন সফলভাবে সেভ হয়েছে!');
    document.getElementById('txn-form').reset();

    updateDashboardStats();
    renderMembersTable();
    renderRecentTransactions();
}

// ড্রপডাউন তালিকা আপডেট
function populateMemberDropdown() {
    const select = document.getElementById('txn-member');
    select.innerHTML = '<option value="">-- সদস্য নির্বাচন করুন --</option>';
    members.filter(m => m.status === 'সক্রিয়').forEach(m => {
        select.innerHTML += `<option value="${m.id}">${m.name} (${m.phone})</option>`;
    });
}

// ৪. ড্যাশবোর্ড আপডেট
function updateDashboardStats() {
    const activeMembers = members.filter(m => m.status === 'সক্রিয়');
    const totalSavings = members.reduce((sum, m) => sum + m.savings, 0);
    const totalLoans = members.reduce((sum, m) => sum + m.loan, 0);
    
    document.getElementById('stat-total-members').innerText = activeMembers.length;
    document.getElementById('stat-total-savings').innerText = '৳ ' + totalSavings;
    document.getElementById('stat-total-loans').innerText = '৳ ' + totalLoans;
}

function renderRecentTransactions() {
    const body = document.getElementById('recent-transactions');
    body.innerHTML = '';
    const recent = transactions.slice(-5).reverse();
    
    if(recent.length === 0) {
        body.innerHTML = '<tr><td colspan="4" class="text-center">কোনো লেনদেন পাওয়া যায়নি</td></tr>';
        return;
    }

    recent.forEach(t => {
        body.innerHTML += `
            <tr>
                <td>${t.date}</td>
                <td>${t.memberName}</td>
                <td>${t.type}</td>
                <td>৳ ${t.amount}</td>
            </tr>
        `;
    });
}

// ৫. নোটিশ বোর্ড
function handlePublishNotice(e) {
    e.preventDefault();
    const title = document.getElementById('notice-title').value;
    const body = document.getElementById('notice-body').value;

    notices.push({ title, body, date: new Date().toLocaleDateString('bn-BD') });
    localStorage.setItem('gs_notices', JSON.stringify(notices));

    alert('নোটিশ প্রকাশিত হয়েছে!');
    document.getElementById('notice-form').reset();
    renderNotices();
}

function renderNotices() {
    const container = document.getElementById('notice-list-container');
    container.innerHTML = '';
    
    if(notices.length === 0) {
        container.innerHTML = '<p>কোনো নোটিশ নেই।</p>';
        return;
    }

    notices.slice().reverse().forEach(n => {
        container.innerHTML += `
            <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
                <h4 style="color: #006a4e;">${n.title} <small style="color: #888; font-size: 12px;">(${n.date})</small></h4>
                <p style="margin-top: 5px; font-size: 14px;">${n.body}</p>
            </div>
        `;
    });
}