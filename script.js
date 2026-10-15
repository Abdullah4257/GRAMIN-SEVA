let members = JSON.parse(localStorage.getItem('gs_members')) || [];
let transactions = JSON.parse(localStorage.getItem('gs_transactions')) || [];
let notices = JSON.parse(localStorage.getItem('gs_notices')) || [];

document.addEventListener('DOMContentLoaded', () => {
    // ডিফল্টভাবে আজকের তারিখ ইনপুটে সেট করা
    const todayStr = new Date().toISOString().split('T')[0];
    if(document.getElementById('txn-date')) document.getElementById('txn-date').value = todayStr;
    if(document.getElementById('m-date')) document.getElementById('m-date').value = todayStr;
    if(document.getElementById('notice-date')) document.getElementById('notice-date').value = todayStr;

    updateDashboardStats();
    renderMembersTable();
    renderArchiveTable();
    populateMemberDropdown();
    renderRecentTransactions();
    renderNotices();
    renderCenterView();
});

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');
}

// তারিখ ফরম্যাট রূপান্তর (YYYY-MM-DD থেকে সুন্দর বাংলা স্টাইলে)
function formatDate(dateString) {
    if(!dateString) return '';
    const parts = dateString.split('-');
    if(parts.length !== 3) return dateString;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

// ১. সদস্য ভর্তি
function handleRegisterMember(e) {
    e.preventDefault();
    
    const rawDate = document.getElementById('m-date').value;
    const formattedDate = formatDate(rawDate);

    const newMember = {
        id: 'GS-' + (1000 + members.length + 1),
        name: document.getElementById('m-name').value,
        guardian: document.getElementById('m-guardian').value,
        nominee: document.getElementById('m-nominee').value,
        phone: document.getElementById('m-phone').value,
        nid: document.getElementById('m-nid').value,
        center: document.getElementById('m-center').value,
        village: document.getElementById('m-village').value,
        savings: parseFloat(document.getElementById('m-init-savings').value) || 0,
        loan: parseFloat(document.getElementById('m-init-loan').value) || 0,
        status: 'সক্রিয়',
        joinedDate: formattedDate,
        history: []
    };

    if(newMember.savings > 0) {
        newMember.history.push({ date: formattedDate, type: 'প্রাথমিক সঞ্চয় জমা', amount: newMember.savings });
        transactions.push({ memberName: newMember.name, center: newMember.center, type: 'প্রাথমিক সঞ্চয় জমা', amount: newMember.savings, date: formattedDate });
    }
    if(newMember.loan > 0) {
        newMember.history.push({ date: formattedDate, type: 'প্রারম্ভিক ঋণ প্রদান', amount: newMember.loan });
        transactions.push({ memberName: newMember.name, center: newMember.center, type: 'প্রারম্ভিক ঋণ প্রদান', amount: newMember.loan, date: formattedDate });
    }

    members.push(newMember);
    saveData();

    alert('সদস্য ভর্তি সফল হয়েছে! আইডি: ' + newMember.id);
    document.getElementById('member-form').reset();
    document.getElementById('m-date').value = new Date().toISOString().split('T')[0];
    
    updateDashboardStats();
    renderMembersTable();
    populateMemberDropdown();
    renderCenterView();
}

// ২. কেন্দ্রভিত্তিক দৃশ্য
function renderCenterView() {
    const selectedCenter = document.getElementById('center-filter').value;
    const container = document.getElementById('center-members-container');
    const centerMembers = members.filter(m => m.center === selectedCenter && m.status === 'সক্রিয়');

    if(centerMembers.length === 0) {
        container.innerHTML = `<p class="text-center" style="padding: 20px; color: #777;">এই কেন্দ্রে কোনো সক্রিয় সদস্য নেই।</p>`;
        return;
    }

    let html = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>আইডি</th>
                    <th>সদস্যের নাম</th>
                    <th>স্বামী/পিতার নাম</th>
                    <th>মোবাইল</th>
                    <th>সঞ্চয় স্থিতি</th>
                    <th>ঋণ স্থিতি</th>
                    <th>প্রোফাইল</th>
                </tr>
            </thead>
            <tbody>
    `;

    centerMembers.forEach(m => {
        html += `
            <tr>
                <td><b>${m.id}</b></td>
                <td>${m.name}</td>
                <td>${m.guardian}</td>
                <td>${m.phone}</td>
                <td>৳ ${m.savings}</td>
                <td>৳ ${m.loan}</td>
                <td><button class="btn btn-info" onclick="openProfile('${m.id}')">প্রোফাইল</button></td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
}

// ৩. সদস্য তালিকা ও প্রোফাইল
function renderMembersTable() {
    const tableBody = document.getElementById('members-list-table');
    const search = document.getElementById('search-member').value.toLowerCase();
    tableBody.innerHTML = '';

    const activeList = members.filter(m => m.status === 'সক্রিয়' && (m.name.toLowerCase().includes(search) || m.phone.includes(search)));

    if (activeList.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">কোনো সদস্য পাওয়া যায়নি</td></tr>';
        return;
    }

    activeList.forEach(m => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><b>${m.id}</b></td>
            <td>${m.name}</td>
            <td>${m.center}</td>
            <td>${m.phone}</td>
            <td>৳ ${m.savings}</td>
            <td>৳ ${m.loan}</td>
            <td>
                <button class="btn btn-info" onclick="openProfile('${m.id}')">প্রোফাইল</button>
                <button class="btn btn-warning" onclick="archiveMember('${m.id}')">বাতিল</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function openProfile(memberId) {
    const m = members.find(item => item.id === memberId);
    if (!m) return;

    let historyHtml = '';
    if(m.history && m.history.length > 0) {
        m.history.slice().reverse().forEach(h => {
            historyHtml += `<tr><td>${h.date}</td><td>${h.type}</td><td>৳ ${h.amount}</td></tr>`;
        });
    } else {
        historyHtml = `<tr><td colspan="3" class="text-center">কোনো লেনদেন রেকর্ড নেই</td></tr>`;
    }

    document.getElementById('profile-details-body').innerHTML = `
        <h2 style="color: var(--primary); margin-bottom: 15px;"><i class="fa-solid fa-user-gear"></i> সদস্যের বিস্তারিত প্রোফাইল</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; font-size: 14px;">
            <p><b>সদস্য আইডি:</b> ${m.id}</p>
            <p><b>নাম:</b> ${m.name}</p>
            <p><b>স্বামী/পিতার নাম:</b> ${m.guardian}</p>
            <p><b>নমিনী:</b> ${m.nominee}</p>
            <p><b>মোবাইল:</b> ${m.phone}</p>
            <p><b>এনআইডি:</b> ${m.nid || 'নেই'}</p>
            <p><b>কেন্দ্র:</b> ${m.center}</p>
            <p><b>গ্রাম:</b> ${m.village}</p>
            <p><b>ভর্তির তারিখ:</b> ${m.joinedDate}</p>
            <p><b>বর্তমান সঞ্চয়:</b> <span style="color: green; font-weight: bold;">৳ ${m.savings}</span></p>
            <p><b>বর্তমান ঋণ:</b> <span style="color: red; font-weight: bold;">৳ ${m.loan}</span></p>
        </div>
        <h3 style="margin-bottom: 10px; border-bottom: 2px solid #ddd; padding-bottom: 5px;">সঞ্চয় ও কিস্তি প্রদানের লেজার ইতিহাস</h3>
        <table class="data-table">
            <thead><tr><th>তারিখ</th><th>বিবরণ</th><th>পরিমাণ</th></tr></thead>
            <tbody>${historyHtml}</tbody>
        </table>
    `;

    document.getElementById('profile-modal').style.display = 'block';
}

function closeProfileModal() {
    document.getElementById('profile-modal').style.display = 'none';
}

// ৪. ক্যালেন্ডার সহ লেনদেন ও রসিদ পোস্টিং
function handleTransaction(e) {
    e.preventDefault();
    const memberId = document.getElementById('txn-member').value;
    const rawDate = document.getElementById('txn-date').value;
    const txnDate = formatDate(rawDate);
    const type = document.getElementById('txn-type').value;
    const amount = parseFloat(document.getElementById('txn-amount').value);

    const member = members.find(m => m.id === memberId);
    if (!member) return;

    let txnLabel = '';
    if (type === 'savings_deposit') { member.savings += amount; txnLabel = 'সঞ্চয় জমা'; }
    else if (type === 'savings_withdraw') {
        if(member.savings < amount) return alert('সদস্যের পর্যাপ্ত সঞ্চয় নেই!');
        member.savings -= amount; txnLabel = 'সঞ্চয় উত্তোলন';
    }
    else if (type === 'loan_repay') { member.loan = Math.max(0, member.loan - amount); txnLabel = 'ঋণের কিস্তি জমা'; }
    else if (type === 'loan_disburse') { member.loan += amount; txnLabel = 'নতুন ঋণ বিতরণ'; }

    member.history.push({ date: txnDate, type: txnLabel, amount: amount });
    transactions.push({ memberName: member.name, center: member.center, type: txnLabel, amount: amount, date: txnDate });

    saveData();

    document.getElementById('receipt-details').innerHTML = `
        <p><b>লেনদেনের তারিখ:</b> ${txnDate}</p>
        <p><b>সদস্যের নাম:</b> ${member.name} (${member.id})</p>
        <p><b>কেন্দ্র:</b> ${member.center}</p>
        <p><b>লেনদেনের বিবরণ:</b> ${txnLabel}</p>
        <p><b>টাকার পরিমাণ:</b> ৳ ${amount} /-</p>
        <p><b>সর্বমোট সঞ্চয় স্থিতি:</b> ৳ ${member.savings}</p>
        <p><b>অবশিষ্ট ঋণ স্থিতি:</b> ৳ ${member.loan}</p>
    `;

    document.getElementById('txn-form').reset();
    document.getElementById('txn-date').value = new Date().toISOString().split('T')[0];
    
    updateDashboardStats();
    renderMembersTable();
    renderCenterView();
    renderRecentTransactions();

    if(confirm('লেনদেন সফলভাবে সেভ হয়েছে! আপনি কি এখনই মানি রসিদ প্রিন্ট করতে চান?')) {
        window.print();
    }
}

// ৫. সদস্য বাতিল ও পুনরুদ্ধার
function archiveMember(memberId) {
    const member = members.find(m => m.id === memberId);
    if(member && confirm(`${member.name}-এর সদস্যপদ বাতিল বা আর্কাইভ করতে চান?`)) {
        member.status = 'বাতিলকৃত';
        saveData();
        renderMembersTable();
        renderArchiveTable();
        updateDashboardStats();
        renderCenterView();
        populateMemberDropdown();
    }
}

function renderArchiveTable() {
    const tableBody = document.getElementById('archive-list-table');
    tableBody.innerHTML = '';
    const archivedList = members.filter(m => m.status === 'বাতিলকৃত');

    if(archivedList.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center">কোনো বাতিলকৃত সদস্য নেই</td></tr>';
        return;
    }

    archivedList.forEach(m => {
        tableBody.innerHTML += `
            <tr>
                <td><b>${m.id}</b></td>
                <td>${m.name}</td>
                <td>${m.center}</td>
                <td>${m.phone}</td>
                <td><span style="color: red; font-weight: bold;">${m.status}</span></td>
                <td>
                    <button class="btn btn-success" onclick="restoreMember('${m.id}')">সক্রিয় করুন</button>
                    <button class="btn btn-danger" onclick="permanentDelete('${m.id}')">ডিলিট</button>
                </td>
            </tr>
        `;
    });
}

function restoreMember(memberId) {
    const m = members.find(item => item.id === memberId);
    if(m) {
        m.status = 'সক্রিয়';
        saveData();
        renderMembersTable();
        renderArchiveTable();
        updateDashboardStats();
        renderCenterView();
        populateMemberDropdown();
    }
}

function permanentDelete(memberId) {
    if(confirm('সতর্কতা! এই সদস্যের সমস্ত তথ্য স্থায়ীভাবে ডিলিট হয়ে যাবে। নিশ্চিত?')) {
        members = members.filter(m => m.id !== memberId);
        saveData();
        renderArchiveTable();
        updateDashboardStats();
    }
}

function populateMemberDropdown() {
    const select = document.getElementById('txn-member');
    select.innerHTML = '<option value="">-- সদস্য নির্বাচন করুন --</option>';
    members.filter(m => m.status === 'সক্রিয়').forEach(m => {
        select.innerHTML += `<option value="${m.id}">${m.name} - ${m.center} (${m.phone})</option>`;
    });
}

function updateDashboardStats() {
    const activeMembers = members.filter(m => m.status === 'সক্রিয়');
    const totalSavings = members.reduce((sum, m) => sum + m.savings, 0);
    const totalLoans = members.reduce((sum, m) => sum + m.loan, 0);
    
    // আজকের তারিখের পোস্টিং হিসাব
    const now = new Date();
    const todayFormatted = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    const todayTotal = transactions.filter(t => t.date === todayFormatted).reduce((sum, t) => sum + t.amount, 0);
    
    document.getElementById('stat-total-members').innerText = activeMembers.length;
    document.getElementById('stat-total-savings').innerText = '৳ ' + totalSavings;
    document.getElementById('stat-total-loans').innerText = '৳ ' + totalLoans;
    document.getElementById('stat-today-collection').innerText = '৳ ' + todayTotal;
}

function renderRecentTransactions() {
    const body = document.getElementById('recent-transactions');
    body.innerHTML = '';
    const recent = transactions.slice(-8).reverse();
    
    if(recent.length === 0) {
        body.innerHTML = '<tr><td colspan="5" class="text-center">কোনো লেনদেন পাওয়া যায়নি</td></tr>';
        return;
    }

    recent.forEach(t => {
        body.innerHTML += `
            <tr>
                <td>${t.date}</td>
                <td><b>${t.memberName}</b></td>
                <td>${t.center || 'সাধারণ'}</td>
                <td>${t.type}</td>
                <td>৳ ${t.amount}</td>
            </tr>
        `;
    });
}

function handlePublishNotice(e) {
    e.preventDefault();
    const rawDate = document.getElementById('notice-date').value;
    const nDate = formatDate(rawDate);
    const title = document.getElementById('notice-title').value;
    const bodyText = document.getElementById('notice-body').value;

    notices.push({ title, body: bodyText, date: nDate });
    saveData();

    alert('নোটিশ প্রকাশিত হয়েছে!');
    document.getElementById('notice-form').reset();
    document.getElementById('notice-date').value = new Date().toISOString().split('T')[0];
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
                <h4 style="color: var(--primary);">${n.title} <small style="color: #888; font-size: 11px;">(${n.date})</small></h4>
                <p style="margin-top: 4px; font-size: 13px;">${n.body}</p>
            </div>
        `;
    });
}

function saveData() {
    localStorage.setItem('gs_members', JSON.stringify(members));
    localStorage.setItem('gs_transactions', JSON.stringify(transactions));
    localStorage.setItem('gs_notices', JSON.stringify(notices));
}