
    // DOM Elements
    const addNoteBtn = document.getElementById('addNoteBtn');
    const notesContainer = document.getElementById('notesContainer');
    const noteModal = document.getElementById('noteModal');
    const closeModal = document.getElementById('closeModal');
    const saveNoteBtn = document.getElementById('saveNoteBtn');
    const noteContent = document.getElementById('noteContent');
    const searchBar = document.getElementById('searchBar');
    const modalTitle = document.getElementById('modalTitle');
    const editIndicator = document.getElementById('editIndicator');
    const noteFile = document.getElementById('noteFile');
    const filePreview = document.getElementById('filePreview');
    const tagInput = document.getElementById('tagInput');
    const fileSizeWarning = document.getElementById('fileSizeWarning');
    const themeToggle = document.getElementById('themeToggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebarToggleIcon = document.getElementById('sidebarToggleIcon');

    // Sidebar toggle logic
    sidebarToggle.addEventListener('click', function() {
        sidebar.classList.toggle('collapsed');
        if (sidebar.classList.contains('collapsed')) {
            sidebarToggleIcon.classList.remove('bi-chevron-left');
            sidebarToggleIcon.classList.add('bi-chevron-right');
        } else {
            sidebarToggleIcon.classList.remove('bi-chevron-right');
            sidebarToggleIcon.classList.add('bi-chevron-left');
        }
    });

    // --- Feature Panel Setup ---
    const featurePanel = document.createElement('div');
    featurePanel.style.position = 'fixed';
    featurePanel.style.top = '0';
    featurePanel.style.left = '0';
    featurePanel.style.width = '100vw';
    featurePanel.style.height = '100vh';
    featurePanel.style.background = 'rgba(0,0,0,0.25)';
    featurePanel.style.display = 'none';
    featurePanel.style.zIndex = '3000';
    featurePanel.style.justifyContent = 'center';
    featurePanel.style.alignItems = 'center';

    featurePanel.innerHTML = `
      <div id="featurePanelContent" style="
          background: #fff;
          color: #222;
          min-width: 320px;
          max-width: 95vw;
          min-height: 180px;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.18);
          padding: 32px 24px 24px 24px;
          position: relative;
          font-size: 1.08rem;
          ">
        <button id="closeFeaturePanel" style="
            position: absolute;
            top: 16px;
            right: 18px;
            background: none;
            border: none;
            font-size: 1.7rem;
            color: #b1a7a6;
            cursor: pointer;
        ">&times;</button>
        <div id="featurePanelBody"></div>
      </div>
    `;
    document.body.appendChild(featurePanel);

    function showFeaturePanel(title, html) {
        document.getElementById('featurePanelBody').innerHTML = `<h3 style="font-size:1.3rem;margin-bottom:1rem;">${title}</h3>${html}`;
        featurePanel.style.display = 'flex';
    }
    document.getElementById('closeFeaturePanel').onclick = () => {
        featurePanel.style.display = 'none';
    };

    // Notes Array (stored in localStorage)
    let notes = JSON.parse(localStorage.getItem('notes_v4')) || [];
    let trash = JSON.parse(localStorage.getItem('notes_trash_v4')) || [];
    let editIndex = null;
    let attachedFiles = [];
    let pinnedFirst = true;

    // --- Sidebar Buttons Functionality ---

    // Notes (Home)
    document.getElementById('sidebar-notes').addEventListener('click', function() {
        featurePanel.style.display = 'none';
        searchBar.value = '';
        renderNotes();
        window.scrollTo({top: 0, behavior: 'smooth'});
    });

    // Reminders
    document.getElementById('sidebar-reminders').addEventListener('click', function() {
        showFeaturePanel(
            'Reminders',
            `<div>
                <p>This feature will let you set reminders for your notes.</p>
                <ul>
                    <li>Set a date and time for a reminder</li>
                    <li>Get notified when it's time</li>
                    <li>See all upcoming reminders here</li>
                </ul>
                <div style="margin-top:1rem;color:#b1a7a6;">(Feature coming soon)</div>
            </div>`
        );
    });

    // Labels
    document.getElementById('sidebar-labels').addEventListener('click', function() {
        showFeaturePanel(
            'Labels',
            `<div>
                <p>Organize your notes with custom labels.</p>
                <ul>
                    <li>Create, edit, and delete labels</li>
                    <li>Assign labels to notes</li>
                    <li>Filter notes by label</li>
                </ul>
                <div style="margin-top:1rem;color:#b1a7a6;">(Feature coming soon)</div>
            </div>`
        );
    });

    // Archive
    document.getElementById('sidebar-archive').addEventListener('click', function() {
        showFeaturePanel(
            'Archive',
            `<div>
                <p>Archived notes will appear here.</p>
                <ul>
                    <li>Move notes to archive to declutter your main view</li>
                    <li>Restore or permanently delete archived notes</li>
                </ul>
                <div style="margin-top:1rem;color:#b1a7a6;">(Feature coming soon)</div>
            </div>`
        );
    });

    // Trash Feature Panel
    document.getElementById('sidebar-trash').addEventListener('click', function() {
        if (trash.length === 0) {
            showFeaturePanel('Trash', `<div style="color:#b1a7a6;">No deleted notes.</div>`);
            return;
        }
        let html = `<div>
            <p>Deleted notes (Trash). You can restore or permanently delete them.</p>
            <div style="max-height:50vh;overflow-y:auto;">`;
        trash.forEach((note, idx) => {
            html += `
            <div style="background:#fffbe6;border-radius:10px;padding:12px 14px;margin-bottom:12px;position:relative;">
                <div style="font-size:1.05rem;margin-bottom:6px;">${sanitize(note.content).slice(0, 120) || '<em>(No content)</em>'}</div>
                <div style="font-size:0.93rem;color:#b1a7a6;margin-bottom:6px;">${note.tags && note.tags.length ? note.tags.map(sanitize).join(', ') : ''}</div>
                <div style="display:flex;gap:10px;">
                    <button onclick="restoreFromTrash(${idx})" style="background:#28a745;color:#fff;border:none;padding:4px 12px;border-radius:6px;cursor:pointer;">Restore</button>
                    <button onclick="deleteForever(${idx})" style="background:#ff4d4d;color:#fff;border:none;padding:4px 12px;border-radius:6px;cursor:pointer;">Delete Forever</button>
                </div>
            </div>`;
        });
        html += `</div></div>`;
        showFeaturePanel('Trash', html);
    });

    // Restore and Delete Forever functions
    window.restoreFromTrash = function(idx) {
        notes.unshift(trash[idx]);
        trash.splice(idx, 1);
        localStorage.setItem('notes_v4', JSON.stringify(notes));
        localStorage.setItem('notes_trash_v4', JSON.stringify(trash));
        document.getElementById('sidebar-trash').click();
        renderNotes(searchBar.value);
    };
    window.deleteForever = function(idx) {
        if (confirm('Permanently delete this note?')) {
            trash.splice(idx, 1);
            localStorage.setItem('notes_trash_v4', JSON.stringify(trash));
            document.getElementById('sidebar-trash').click();
        }
    };

    // Settings
    document.getElementById('sidebar-settings').addEventListener('click', function() {
        showFeaturePanel(
            'Settings',
            `<div>
                <p>Customize your notes experience:</p>
                <ul>
                    <li>Toggle dark/light mode</li>
                    <li>Change font size</li>
                    <li>Export or import notes</li>
                    <li>Clear all notes</li>
                </ul>
                <div style="margin-top:1rem;color:#b1a7a6;">(More settings coming soon)</div>
            </div>`
        );
    });

    // Utility: Format date 
    function formatDate(ts) {
        const d = new Date(ts);
        const dateStr = d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
        const timeStr = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true });
        return `${dateStr} • ${timeStr}`;
    }

    // Utility: Sanitize input (basic)
    function sanitize(str) {
        return str.replace(/[<>&"]/g, function(c) {
            return {'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c];
        });
    }

    // Utility: Render file previews
    function renderFilePreview(files) {
        filePreview.innerHTML = '';
        files.forEach((file, idx) => {
            let el;
            if (file.type.startsWith('image/')) {
                el = document.createElement('img');
                el.src = file.data;
                el.style.width = '60px';
                el.style.height = '60px';
                el.style.objectFit = 'cover';
                el.style.borderRadius = '8px';
                el.title = file.name;
            } else {
                el = document.createElement('a');
                el.href = file.data;
                el.target = '_blank';
                el.textContent = file.name;
                el.style.display = 'inline-block';
                el.style.background = '#f1f3f7';
                el.style.padding = '4px 8px';
                el.style.borderRadius = '6px';
                el.style.fontSize = '0.95rem';
                el.style.marginRight = '4px';
            }
            // Remove button
            const removeBtn = document.createElement('button');
            removeBtn.innerHTML = '&times;';
            removeBtn.style.marginLeft = '4px';
            removeBtn.style.background = '#ff4d4d';
            removeBtn.style.color = '#fff';
            removeBtn.style.border = 'none';
            removeBtn.style.borderRadius = '50%';
            removeBtn.style.width = '20px';
            removeBtn.style.height = '20px';
            removeBtn.style.cursor = 'pointer';
            removeBtn.onclick = () => {
                attachedFiles.splice(idx, 1);
                renderFilePreview(attachedFiles);
            };
            const wrapper = document.createElement('div');
            wrapper.style.display = 'flex';
            wrapper.style.alignItems = 'center';
            wrapper.appendChild(el);
            wrapper.appendChild(removeBtn);
            filePreview.appendChild(wrapper);
        });
    }

    // Drag & Drop for file upload
    filePreview.addEventListener('dragover', e => {
        e.preventDefault();
        filePreview.style.background = '#ffe066';
    });
    filePreview.addEventListener('dragleave', e => {
        filePreview.style.background = '';
    });
    filePreview.addEventListener('drop', e => {
        e.preventDefault();
        filePreview.style.background = '';
        handleFiles(Array.from(e.dataTransfer.files));
    });

    // File size limit (2MB per file)
    function handleFiles(files) {
        let warning = '';
        for (const file of files) {
            if (file.size > 2 * 1024 * 1024) {
                warning += `${file.name} is too large (max 2MB).<br>`;
                continue;
            }
            const reader = new FileReader();
            reader.onload = function(evt) {
                attachedFiles.push({
                    name: file.name,
                    type: file.type,
                    data: evt.target.result
                });
                renderFilePreview(attachedFiles);
            };
            reader.readAsDataURL(file);
        }
        if (warning) {
            fileSizeWarning.innerHTML = warning;
            fileSizeWarning.style.display = '';
        } else {
            fileSizeWarning.style.display = 'none';
        }
    }

    // Handle file input
    noteFile.addEventListener('change', function(e) {
        handleFiles(Array.from(e.target.files));
        noteFile.value = '';
    });

    // Function to Render Notes
    function renderNotes(filter = '') {
        notesContainer.innerHTML = '';
        let filteredNotes = notes;
        if (filter.trim()) {
            filteredNotes = notes.filter(n =>
                n.content.toLowerCase().includes(filter.toLowerCase()) ||
                (n.tags && n.tags.join(',').toLowerCase().includes(filter.toLowerCase()))
            );
        }
        // Sort pinned notes first
        filteredNotes = filteredNotes.slice().sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
        if (filteredNotes.length === 0) {
            notesContainer.innerHTML = `<div style="grid-column: 1/-1; text-align:center; color:#b1a7a6; font-size:1.1rem; padding:32px 0;">No notes found.</div>`;
            return;
        }
        filteredNotes.forEach((note, index) => {
            const noteElement = document.createElement('div');
            noteElement.classList.add('note');
            if (note.pinned) noteElement.classList.add('pinned');
            // Tags
            let tagsHtml = '';
            if (note.tags && note.tags.length) {
                tagsHtml = `<div class="note-tags">` +
                    note.tags.map(tag => `<span class="note-tag">${sanitize(tag)}</span>`).join('') +
                    `</div>`;
            }
            // Files
            let filesHtml = '';
            if (note.files && note.files.length) {
                filesHtml = `<div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:8px;">` +
                    note.files.map(f => {
                        if (f.type && f.type.startsWith('image/')) {
                            return `<img src="${f.data}" style="width:48px;height:48px;object-fit:cover;border-radius:6px;" title="${sanitize(f.name)}">`;
                        } else {
                            return `<a href="${f.data}" target="_blank" style="background:#f1f3f7;padding:2px 6px;border-radius:5px;font-size:0.95rem;">${sanitize(f.name)}</a>`;
                        }
                    }).join('') +
                    `</div>`;
            }
            // Pin icon
            const pinIcon = note.pinned ? 'bi-pin-fill' : 'bi-pin';
            noteElement.innerHTML = `
                ${tagsHtml}
                <p>${sanitize(note.content).replace(/\n/g, '<br>')}</p>
                ${filesHtml}
                <div class="note-footer">
                    <div class="note-actions">
                        <button class="icon-btn pin ${note.pinned ? 'pinned' : ''}" title="Pin/Unpin" onclick="togglePin(${notes.indexOf(note)})"><i class="bi ${pinIcon}"></i></button>
                        <button class="icon-btn" title="Share" onclick="shareNote(${notes.indexOf(note)})"><i class="bi bi-share"></i></button>
                        <button class="icon-btn" title="Copy" onclick="copyNote(${notes.indexOf(note)})"><i class="bi bi-clipboard"></i></button>
                        <button class="icon-btn" title="Edit" onclick="editNote(${notes.indexOf(note)})"><i class="bi bi-pencil"></i></button>
                        <button class="icon-btn delete" title="Delete" onclick="deleteNote(${notes.indexOf(note)})"><i class="bi bi-trash"></i></button>
                    </div>
                    <span class="note-date"><i class="bi bi-clock"></i> ${formatDate(note.updatedAt)}</span>
                </div>
            `;
            notesContainer.appendChild(noteElement);
        });
    }

    // Function to Add or Edit a Note
    function saveNote() {
        const content = noteContent.value.trim();
        const tags = tagInput.value.split(',').map(t => t.trim()).filter(Boolean);
        if (!content && attachedFiles.length === 0) return;
        if (editIndex !== null) {
            notes[editIndex].content = content;
            notes[editIndex].updatedAt = Date.now();
            notes[editIndex].files = attachedFiles.slice();
            notes[editIndex].tags = tags;
            editIndex = null;
        } else {
            notes.unshift({
                content,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                files: attachedFiles.slice(),
                tags,
                pinned: false
            });
        }
        localStorage.setItem('notes_v4', JSON.stringify(notes));
        renderNotes(searchBar.value);
        closeModalHandler();
    }

    // Function to Delete a Note (move to trash)
    window.deleteNote = function(index) {
        if (confirm('Delete this note? It will be moved to Trash.')) {
            trash.unshift(notes[index]);
            notes.splice(index, 1);
            localStorage.setItem('notes_v4', JSON.stringify(notes));
            localStorage.setItem('notes_trash_v4', JSON.stringify(trash));
            renderNotes(searchBar.value);
        }
    };

    // Function to Edit a Note
    window.editNote = function(index) {
        editIndex = index;
        noteContent.value = notes[index].content;
        modalTitle.textContent = "Edit Note";
        editIndicator.style.display = '';
        attachedFiles = notes[index].files ? notes[index].files.slice() : [];
        tagInput.value = notes[index].tags ? notes[index].tags.join(', ') : '';
        renderFilePreview(attachedFiles);
        openModal();
    };

    // Function to Pin/Unpin a Note
    window.togglePin = function(index) {
        notes[index].pinned = !notes[index].pinned;
        localStorage.setItem('notes_v4', JSON.stringify(notes));
        renderNotes(searchBar.value);
    };

    // Function to Share a Note
    window.shareNote = function(index) {
        const note = notes[index];
        let shareText = note.content;
        if (note.tags && note.tags.length) {
            shareText += '\nTags: ' + note.tags.join(', ');
        }
        if (note.files && note.files.length) {
            shareText += '\n\nAttachments:\n' + note.files.map(f => f.name).join(', ');
        }
        if (navigator.share) {
            navigator.share({
                title: 'Shared Note',
                text: shareText
            }).catch(() => {});
        } else {
            const encoded = encodeURIComponent(shareText);
            const url = window.location.href;
            const fb = `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${encoded}`;
            const tw = `https://twitter.com/intent/tweet?text=${encoded}`;
            const wa = `https://wa.me/?text=${encoded}`;
            const mail = `mailto:?subject=Shared Note&body=${encoded}`;
            const links = `
                <div style="padding:12px;">
                    <a href="${fb}" target="_blank" style="margin-right:10px;">Facebook</a>
                    <a href="${tw}" target="_blank" style="margin-right:10px;">Twitter/X</a>
                    <a href="${wa}" target="_blank" style="margin-right:10px;">WhatsApp</a>
                    <a href="${mail}" target="_blank">Email</a>
                </div>
            `;
            const temp = document.createElement('div');
            temp.innerHTML = `<div style="position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.3);z-index:9999;display:flex;align-items:center;justify-content:center;">
                <div style="background:#fff;padding:24px 18px;border-radius:12px;max-width:90vw;">
                    <div style="font-weight:600;margin-bottom:10px;">Share this note:</div>
                    ${links}
                    <button style="margin-top:10px;" onclick="this.closest('div[style]').remove()">Close</button>
                </div>
            </div>`;
            document.body.appendChild(temp.firstChild);
        }
    };

    // Function to Copy Note Content
    window.copyNote = function(index) {
        const note = notes[index];
        let text = note.content;
        if (note.tags && note.tags.length) {
            text += '\nTags: ' + note.tags.join(', ');
        }
        if (note.files && note.files.length) {
            text += '\n\nAttachments:\n' + note.files.map(f => f.name).join(', ');
        }
        navigator.clipboard.writeText(text).then(() => {
            saveNoteBtn.textContent = "Copied!";
            setTimeout(() => saveNoteBtn.innerHTML = '<i class="bi bi-check-lg"></i> Save', 1000);
        });
    };

    // Function to Open Modal
    function openModal() {
        noteModal.style.display = 'flex';
        setTimeout(() => noteContent.focus(), 100);
    }

    // Function to Close Modal
    function closeModalHandler() {
        noteModal.style.display = 'none';
        noteContent.value = '';
        tagInput.value = '';
        modalTitle.textContent = "Add Note";
        editIndicator.style.display = 'none';
        attachedFiles = [];
        renderFilePreview(attachedFiles);
        fileSizeWarning.style.display = 'none';
        editIndex = null;
    }

    // Search Functionality
    searchBar.addEventListener('input', () => renderNotes(searchBar.value));

    // Event Listeners
    addNoteBtn.addEventListener('click', () => {
        editIndex = null;
        noteContent.value = '';
        tagInput.value = '';
        modalTitle.textContent = "Add Note";
        editIndicator.style.display = 'none';
        attachedFiles = [];
        renderFilePreview(attachedFiles);
        fileSizeWarning.style.display = 'none';
        openModal();
    });
    closeModal.addEventListener('click', closeModalHandler);
    saveNoteBtn.addEventListener('click', saveNote);
    noteContent.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'Enter') saveNote();
    });
    window.addEventListener('click', function(e) {
        if (e.target === noteModal) closeModalHandler();
    });

    // Keyboard shortcut: Ctrl+Alt+N for new note
    window.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.altKey && e.key.toLowerCase() === 'n') {
            e.preventDefault();
            addNoteBtn.click();
        }
    });

    // Theme toggle
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark');
        themeToggle.innerHTML = document.body.classList.contains('dark')
            ? '<i class="bi bi-brightness-high"></i>'
            : '<i class="bi bi-moon"></i>';
    });

    // Initial Render
    renderNotes();
