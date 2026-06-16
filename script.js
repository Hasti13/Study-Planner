// Core application state
let subjects=JSON.parse(localStorage.getItem('studyflow-subjects')) || [];

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    renderSubjects();
    renderAnalytics();
});

function switchTab(tabId, event) {
    document.querySelectorAll('.panel').forEach(panel=>{
        panel.classList.remove('active');
    });
    document.querySelectorAll('.navtab').forEach(tab=>{
        tab.classList.remove('active');
    });
    
    document.getElementById(tabId).classList.add('active');
    event.target.classList.add('active');
}

function addSubject() {
    const name=document.getElementById('subjectName').value.trim();
    const examDate=document.getElementById('examDate').value;
    const totalHours=parseInt(document.getElementById('totalHours').value) || 0;

    if(!name || !examDate || totalHours <= 0){
        showNotification('Please fill all fields correctly!', 'error');
        return;
    }

    const subject={
        id: Date.now(),
        name,
        examDate: new Date(examDate),
        totalHours,
        studiedHours: 0
    };

    subjects.push(subject);
    saveData();
    renderSubjects();
    renderAnalytics();
    clearForm();
    showNotification(`Added ${name} successfully!`, 'success');
}

function clearForm(){
    document.getElementById('subjectName').value='';
    document.getElementById('examDate').value='';
    document.getElementById('totalHours').value='';
}

function renderSubjects(){
    const container=document.getElementById('subjectsContainer');
    container.innerHTML='';

    subjects.forEach(subject=>{
        const daysLeft = Math.max(0, Math.ceil((subject.examDate-new Date()) / (1000 * 60 * 60 * 24)));
        const progress = Math.min(100, (subject.studiedHours / subject.totalHours) * 100);
        
        const card=document.createElement('div');
        card.className='subject-card';
        card.innerHTML= `
            <div class="subject-title">
                <i class="fas fa-book"></i> ${subject.name}
            </div>
            <div class="countdown-badge">
                <i class="fas fa-clock"></i>
                ${daysLeft === 0 ? 'TODAY!' : `${daysLeft} days left`}
            </div>
            <div class="hours-tracker">
                <div>Total: ${subject.totalHours}h</div>
                <div>Studied: ${subject.studiedHours}h</div>
            </div>
            <div class="progress-container">
                <div class="progress-circle" style="--progress: ${progress}">
                    <div class="progress-text">${progress.toFixed(0)}%</div>
                </div>
            </div>
            <div style="display: flex; gap: 15px; flex-wrap: wrap;">
                <input type="number" id="hours-${subject.id}" min="0" max="${subject.totalHours - subject.studiedHours}" 
                       placeholder="Today's hours" style="flex: 1; padding: 12px 15px; border-radius: 15px; border: 1px solid rgba(255,255,255,0.3); background: rgba(255,255,255,0.1); color: white;">
                <button class="primary" onclick="updateSubjectHours(${subject.id})">
                    <i class="fas fa-check"></i>
                </button>
                <button class="secondary" onclick="deleteSubject(${subject.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

function updateSubjectHours(subjectId) {
    const input=document.getElementById(`hours-${subjectId}`);
    const hours=parseInt(input.value) || 0;
    
    const subject=subjects.find(s => s.id === subjectId);
    if(subject && hours > 0){
        subject.studiedHours = Math.min(subject.totalHours, subject.studiedHours + hours);
        saveData();
        renderSubjects();
        renderAnalytics();
        input.value = '';
        showNotification('Progress updated!', 'success');
    }
}

function deleteSubject(subjectId){
    subjects=subjects.filter(s => s.id !== subjectId);
    saveData();
    renderSubjects();
    renderAnalytics();
    showNotification('Subject removed', 'warning');
}

function generateSchedule(){
    if (subjects.length === 0) {
        showNotification('Add subjects first!', 'error');
        return;
    }

    const table=document.getElementById('scheduleTable');
    const tbody=document.getElementById('scheduleBody');
    tbody.innerHTML= '';
    
    const prioritized=[...subjects].sort((a, b) => 
        (b.examDate-new Date()) - (a.examDate-new Date())
    );

    prioritized.slice(0, 8).forEach((subject, index)=>{
        const slotDuration = 60 + (index % 3) * 15;
        tbody.innerHTML += `
            <tr>
                <td>${subject.name}</td>
                <td>${slotDuration} min</td>
                <td>${index < 7 ? '15 min' : 'Day Complete'}</td>
            </tr>
        `;
    });

    table.style.display='table';
    showNotification('Schedule generated!', 'success');
}

function resetSchedule(){
    document.getElementById('scheduleTable').style.display = 'none';
}

function renderAnalytics() {
    const totalHours = subjects.reduce((sum, s) => sum + s.totalHours, 0);
    const studiedHours = subjects.reduce((sum, s) => sum + s.studiedHours, 0);
    const overallProgress = totalHours ? (studiedHours / totalHours * 100) : 0;
    const urgentSubjects = subjects.filter(s => 
        Math.ceil((s.examDate - new Date()) / (1000 * 60 * 60 * 24)) <= 7
    ).length;

    document.getElementById('statsGrid').innerHTML = `
        <div class="stat-card">
            <div class="stat-number">${overallProgress.toFixed(1)}%</div>
            <div style="color: rgba(255,255,255,0.8);">Overall Progress</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${subjects.length}</div>
            <div style="color: rgba(255,255,255,0.8);">Subjects</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${urgentSubjects}</div>
            <div style="color: rgba(255,255,255,0.8);">Urgent Exams</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${studiedHours.toFixed(1)}h</div>
            <div style="color: rgba(255,255,255,0.8);">Hours Studied</div>
        </div>
    `;
    const progressGrid = document.getElementById('progressGrid');
    progressGrid.innerHTML = '';
            
    subjects.forEach(subject => {
        const progress = Math.min(100, (subject.studiedHours / subject.totalHours) * 100);
        const card = document.createElement('div');
        card.className = 'subject-card';
        card.innerHTML = `
            <div class="subject-title">${subject.name}</div>
            <div class="progress-circle" style="--progress: ${progress}">
                <div class="progress-text">${progress.toFixed(0)}%</div>
            </div>
            <div style="text-align: center; color: rgba(255,255,255,0.9); margin-top: 15px;">
                ${subject.studiedHours}/${subject.totalHours}h
            </div>
        `;
        progressGrid.appendChild(card);
    });
}

function saveData() {
    localStorage.setItem('studyflow-subjects', JSON.stringify(subjects));
}

function showNotification(message, type='success') {
    // Create floating notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 30px;
        right: 30px;
        background: ${type === 'success' ? 'rgba(79, 172, 254, 0.95)' : 
                    type === 'error' ? 'rgba(255, 107, 107, 0.95)' : 
                    'rgba(255, 193, 7, 0.95)'};
        color: white;
        padding: 20px 30px;
        border-radius: 20px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        backdrop-filter: blur(10px);
        z-index: 1000;
        transform: translateX(400px);
        transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        font-weight: 500;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
            
    setTimeout(() => notification.style.transform = 'translateX(0)', 100);
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => document.body.removeChild(notification), 400);
    }, 3000);
}