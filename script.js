// Task Manager Application
class TodoApp {
    constructor() {
        this.tasks = [];
        this.lists = [
            { id: 'personal', name: 'Personal', color: '#0078d4' },
            { id: 'work', name: 'Work', color: '#00bcf2' },
            { id: 'shopping', name: 'Shopping', color: '#00b7c3' }
        ];
        this.currentFilter = 'all';
        this.currentSort = 'default';
        this.selectedTask = null;
        this.currentView = 'list';
        this.editingListId = null;
        this.selectedColor = '#0078d4';
        this.addTaskInProgress = false; // Add flag to prevent duplicate submissions
        
        this.init();
    }

    init() {
        this.loadFromStorage();
        this.bindEvents();
        this.renderUI();
        this.updateCurrentDate();
        this.addRippleCSS();
        this.initEnhancedEffects();
        
        // Auto-save every 30 seconds
        setInterval(() => this.saveToStorage(), 30000);
    }

    // Initialize enhanced visual effects
    initEnhancedEffects() {
        // Add welcome animation
        setTimeout(() => {
            this.showNotification('Welcome to My To-Do! ✨', 'info');
        }, 1000);

        // Add interactive hover effects to buttons
        document.querySelectorAll('.btn, .option-btn, .task-action-btn').forEach(btn => {
            this.addRippleEffect(btn);
        });

        // Add floating animation to empty state
        const emptyState = document.getElementById('emptyState');
        if (emptyState) {
            this.addFloatingAnimation(emptyState);
        }

        // Add particle system
        this.initParticleSystem();
    }

    // Add floating animation
    addFloatingAnimation(element) {
        let animationId;
        let start = null;
        
        const animate = (timestamp) => {
            if (!start) start = timestamp;
            const progress = (timestamp - start) / 3000; // 3 second cycle
            
            const yOffset = Math.sin(progress * 2 * Math.PI) * 10;
            element.style.transform = `translateY(${yOffset}px)`;
            
            animationId = requestAnimationFrame(animate);
        };
        
        if (element && !element.classList.contains('hidden')) {
            animationId = requestAnimationFrame(animate);
        }
    }

    // Initialize particle system
    initParticleSystem() {
        // This creates a subtle particle effect for special moments
        this.particles = [];
    }

    // Create celebration particles when task is completed
    createCelebrationParticles(element) {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        for (let i = 0; i < 12; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: fixed;
                width: 6px;
                height: 6px;
                background: linear-gradient(135deg, #0078d4, #40e0d0);
                border-radius: 50%;
                pointer-events: none;
                z-index: 1000;
                left: ${centerX}px;
                top: ${centerY}px;
            `;
            
            document.body.appendChild(particle);
            
            // Animate particle
            const angle = (i / 12) * 2 * Math.PI;
            const distance = 50 + Math.random() * 30;
            const duration = 800 + Math.random() * 400;
            
            particle.animate([
                {
                    transform: 'translate(0, 0) scale(1)',
                    opacity: 1
                },
                {
                    transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) scale(0)`,
                    opacity: 0
                }
            ], {
                duration: duration,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
            }).onfinish = () => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            };
        }
    }

    // Event Bindings
    bindEvents() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => this.handleNavigation(e));
        });

        // Add task functionality
        document.getElementById('addTaskBtn').addEventListener('click', () => this.showAddTaskForm());
        document.getElementById('addTaskSubmit').addEventListener('click', () => this.addTask());
        document.getElementById('cancelAddTask').addEventListener('click', () => this.hideAddTaskForm());
        
        // Enhanced Enter key handling for task input
        document.getElementById('taskInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.addTask();
            }
        });

        // Add task options
        document.getElementById('dueDateBtn').addEventListener('click', () => {
            console.log('Date button clicked');
            this.toggleDateInput();
        });
        document.getElementById('importantBtn').addEventListener('click', () => {
            console.log('Important button clicked');
            this.toggleImportantInput();
        });
        document.getElementById('categoryBtn').addEventListener('click', () => {
            console.log('Category button clicked');
            this.toggleCategoryInput();
        });

        // Enter key support for additional inputs
        document.getElementById('dueDateInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.addTask();
            }
        });
        
        document.getElementById('categorySelect').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.addTask();
            }
        });

        // Universal Enter key handler for the entire add task form
        document.getElementById('addTaskForm').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.addTask();
            }
        });

        // Also handle Enter key on any input/select within the form
        document.getElementById('addTaskForm').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.addTask();
            }
        });

        // Sorting and view options
        document.getElementById('sortBtn').addEventListener('click', (e) => this.toggleSortMenu(e));
        document.querySelectorAll('.sort-option').forEach(option => {
            option.addEventListener('click', (e) => this.handleSort(e));
        });
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleViewChange(e));
        });

        // Completed tasks toggle
        document.getElementById('completedToggle').addEventListener('click', () => this.toggleCompletedTasks());

        // Task detail panel
        document.getElementById('closeDetailBtn').addEventListener('click', () => this.closeTaskDetail());
        document.getElementById('detailTaskTitle').addEventListener('input', (e) => this.updateTaskTitle(e));
        document.getElementById('detailDueDate').addEventListener('change', (e) => this.updateTaskDueDate(e));
        document.getElementById('detailNotes').addEventListener('input', (e) => this.updateTaskNotes(e));
        document.getElementById('detailImportantBtn').addEventListener('click', () => this.toggleTaskImportant());
        document.getElementById('deleteTaskBtn').addEventListener('click', () => this.showDeleteConfirmation());

        // Modals
        document.getElementById('modalOverlay').addEventListener('click', (e) => {
            if (e.target.id === 'modalOverlay') this.closeModal();
        });
        document.getElementById('confirmDeleteBtn').addEventListener('click', () => this.deleteTask());
        document.getElementById('cancelDeleteBtn').addEventListener('click', () => this.closeModal());

        // Custom lists
        document.getElementById('addListBtn').addEventListener('click', () => this.showAddListModal());
        document.getElementById('createListBtn').addEventListener('click', () => this.saveCustomList());
        document.getElementById('cancelListBtn').addEventListener('click', () => this.closeModal());
        document.getElementById('newListInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.saveCustomList();
        });

        // Delete list modal
        document.getElementById('confirmDeleteListBtn').addEventListener('click', () => this.deleteCustomList());
        document.getElementById('cancelDeleteListBtn').addEventListener('click', () => this.closeModal());

        // Color picker
        document.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', (e) => this.selectColor(e));
        });

        // Sidebar toggle for mobile
        document.getElementById('sidebarToggle').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleSidebar();
        });

        // Overlay for closing sidebar
        document.getElementById('overlay').addEventListener('click', () => this.closeSidebar());

        // Close menus when clicking outside
        document.addEventListener('click', (e) => this.handleOutsideClick(e));

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));

        // Prevent form submission
        document.addEventListener('submit', (e) => e.preventDefault());
    }

    // Navigation
    handleNavigation(e) {
        const filter = e.currentTarget.dataset.filter;
        if (!filter) return;

        console.log('Navigating to:', filter);

        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        e.currentTarget.classList.add('active');

        this.currentFilter = filter;
        this.updateCurrentListTitle();
        
        // Force a complete UI refresh
        setTimeout(() => {
            this.renderTasks();
            this.updateTaskCounts();
        }, 0);
        
        this.closeSidebar();
        
        // Log for debugging
        console.log('Navigation to:', filter, 'Total tasks:', this.tasks.length);
    }

    updateCurrentListTitle() {
        const titles = {
            'all': 'My Day',
            'important': 'Important',
            'planned': 'Planned',
            'completed': 'Completed'
        };

        const customList = this.lists.find(list => list.id === this.currentFilter);
        const title = customList ? customList.name : titles[this.currentFilter] || 'My Day';
        
        document.getElementById('currentListTitle').textContent = title;
    }

    // Task Management
    addTask() {
        // Prevent duplicate submissions
        if (this.addTaskInProgress) {
            console.log('Add task already in progress, ignoring');
            return;
        }
        
        this.addTaskInProgress = true;
        
        const input = document.getElementById('taskInput');
        
        // Check if input exists and get value immediately
        if (!input) {
            console.error('Task input element not found');
            this.addTaskInProgress = false;
            return;
        }
        
        const rawValue = input.value;
        const title = rawValue ? rawValue.trim() : '';

        if (!title || title.length === 0) {
            this.showNotification('Please enter a task title', 'error');
            input.focus(); // Keep focus on input
            this.addTaskInProgress = false;
            return;
        }

        if (title.length > 255) {
            this.showNotification('Task title is too long (max 255 characters)', 'error');
            input.focus();
            this.addTaskInProgress = false;
            return;
        }

        // Get all available options automatically
        const dueDate = document.getElementById('dueDateInput').value;
        const isImportant = document.getElementById('importantBtn').classList.contains('active');
        const category = document.getElementById('categorySelect').value;

        // Auto-assign category if we're in a custom list and no category is selected
        let finalCategory = category || null;
        if (!finalCategory && this.currentFilter !== 'all' && this.currentFilter !== 'important' && this.currentFilter !== 'planned' && this.currentFilter !== 'completed') {
            // We're in a custom list, auto-assign the current filter as category
            const customList = this.lists.find(l => l.id === this.currentFilter);
            if (customList) {
                finalCategory = this.currentFilter;
            }
        }

        // Create task with all available options
        const task = {
            id: this.generateId(),
            title: title,
            completed: false,
            important: isImportant,
            dueDate: dueDate || null,
            category: finalCategory,
            notes: '',
            createdAt: new Date().toISOString(),
            completedAt: null
        };

        this.tasks.unshift(task);
        this.saveToStorage();
        
        // Clear input immediately after successful task creation
        document.getElementById('taskInput').value = '';
        
        // Force immediate UI refresh with timeout to ensure DOM updates
        setTimeout(() => {
            this.renderTasks();
            this.updateTaskCounts();
        }, 0);
        
        this.hideAddTaskForm();
        this.resetAddTaskForm();

        // Debug logging
        console.log('Task added with options:', {
            title: task.title,
            category: task.category,
            dueDate: task.dueDate,
            important: task.important
        });
        
        // Show success message with added options
        let optionsMsg = [];
        if (task.dueDate) optionsMsg.push('📅 Due date set');
        if (task.important) optionsMsg.push('⭐ Marked important');
        if (task.category) {
            const listName = this.getListName(task.category);
            optionsMsg.push(`📋 Added to ${listName}`);
        }
        
        const successMsg = optionsMsg.length > 0 
            ? `Task added successfully! ${optionsMsg.join(', ')} ✅`
            : 'Task added successfully! ✅';
            
        this.showNotification(successMsg, 'success');
        
        // Reset the flag to allow future submissions
        this.addTaskInProgress = false;
    }

    updateTask(taskId, updates) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        Object.assign(task, updates);
        this.saveToStorage();
        this.renderTasks();
        this.updateTaskCounts();

        if (this.selectedTask && this.selectedTask.id === taskId) {
            this.selectedTask = task;
        }
    }

    toggleTaskComplete(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        task.completed = !task.completed;
        task.completedAt = task.completed ? new Date().toISOString() : null;

        // Add celebration effect for completed tasks
        if (task.completed) {
            const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
            if (taskElement) {
                this.createCelebrationParticles(taskElement);
                
                // Add completion animation
                taskElement.style.animation = 'taskComplete 0.6s ease';
                setTimeout(() => {
                    taskElement.style.animation = '';
                }, 600);
            }
            
            // Only show notification for important tasks or if user wants feedback
            if (task.important) {
                this.showNotification('✅ Important task completed!', 'success');
            }
        } else {
            // No notification for reopening tasks to reduce noise
        }

        this.updateTask(taskId, {});
    }

    toggleTaskImportant(taskId = null) {
        const id = taskId || (this.selectedTask && this.selectedTask.id);
        if (!id) return;

        const task = this.tasks.find(t => t.id === id);
        if (!task) return;

        task.important = !task.important;
        this.updateTask(id, {});

        if (this.selectedTask && this.selectedTask.id === id) {
            this.updateTaskDetailPanel();
        }
    }

    deleteTask() {
        if (!this.selectedTask) return;

        this.tasks = this.tasks.filter(t => t.id !== this.selectedTask.id);
        this.saveToStorage();
        this.renderTasks();
        this.updateTaskCounts();
        this.closeTaskDetail();
        this.closeModal();

        this.showNotification('Task deleted', 'success');
    }

    // Task Detail Panel
    showTaskDetail(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        this.selectedTask = task;
        this.updateTaskDetailPanel();
        document.getElementById('taskDetailPanel').classList.remove('hidden');
        
        if (window.innerWidth <= 768) {
            document.getElementById('taskDetailPanel').classList.add('open');
        }
    }

    updateTaskDetailPanel() {
        if (!this.selectedTask) return;

        const task = this.selectedTask;
        
        document.getElementById('detailTaskCheckbox').checked = task.completed;
        document.getElementById('detailTaskTitle').value = task.title;
        document.getElementById('detailDueDate').value = task.dueDate || '';
        document.getElementById('detailNotes').value = task.notes || '';
        
        const importantBtn = document.getElementById('detailImportantBtn');
        const starIcon = importantBtn.querySelector('i');
        
        if (task.important) {
            importantBtn.classList.add('active');
            starIcon.className = 'fas fa-star';
        } else {
            importantBtn.classList.remove('active');
            starIcon.className = 'far fa-star';
        }
    }

    closeTaskDetail() {
        document.getElementById('taskDetailPanel').classList.add('hidden');
        document.getElementById('taskDetailPanel').classList.remove('open');
        this.selectedTask = null;
    }

    updateTaskTitle(e) {
        if (!this.selectedTask) return;
        
        const newTitle = e.target.value.trim();
        if (newTitle && newTitle !== this.selectedTask.title) {
            this.updateTask(this.selectedTask.id, { title: newTitle });
        }
    }

    updateTaskDueDate(e) {
        if (!this.selectedTask) return;
        
        const dueDate = e.target.value || null;
        this.updateTask(this.selectedTask.id, { dueDate });
    }

    updateTaskNotes(e) {
        if (!this.selectedTask) return;
        
        const notes = e.target.value;
        this.updateTask(this.selectedTask.id, { notes });
    }

    // Rendering
    renderTasks() {
        const filteredTasks = this.getFilteredTasks();
        const sortedTasks = this.getSortedTasks(filteredTasks);
        
        const activeTasks = sortedTasks.filter(task => !task.completed);
        const completedTasks = sortedTasks.filter(task => task.completed);

        console.log('Rendering tasks for filter:', this.currentFilter, {
            filteredTasks: filteredTasks.length,
            activeTasks: activeTasks.length,
            completedTasks: completedTasks.length
        });

        this.renderActiveTasksList(activeTasks);
        this.renderCompletedTasksList(completedTasks);
        this.updateEmptyState(activeTasks.length === 0 && completedTasks.length === 0);
    }

    renderActiveTasksList(tasks) {
        const container = document.getElementById('tasksList');
        const isTableView = container.classList.contains('table-view');
        
        if (tasks.length === 0) {
            container.innerHTML = '';
            return;
        }

        let html = '';
        
        if (isTableView) {
            html = `
                <div class="table-header">
                    <div class="table-header-cell task-checkbox-cell">
                        <i class="fas fa-check"></i>
                    </div>
                    <div class="table-header-cell task-title-cell">Task</div>
                    <div class="table-header-cell task-due-date-cell">Due Date</div>
                    <div class="table-header-cell task-category-cell">List</div>
                    <div class="table-header-cell task-actions-cell">Actions</div>
                </div>
            `;
        }
        
        html += tasks.map(task => this.createTaskHTML(task)).join('');
        container.innerHTML = html;
        this.bindTaskEvents(container);
    }

    renderCompletedTasksList(tasks) {
        const container = document.getElementById('completedTasksList');
        const countElement = document.getElementById('completedTasksCount');
        
        countElement.textContent = tasks.length;
        
        if (tasks.length === 0) {
            container.innerHTML = '';
            document.getElementById('completedTasksSection').style.display = 'none';
            return;
        }

        document.getElementById('completedTasksSection').style.display = 'block';
        container.innerHTML = tasks.map(task => this.createTaskHTML(task)).join('');
        this.bindTaskEvents(container);
    }

    createTaskHTML(task) {
        const dueDate = this.formatDueDate(task.dueDate);
        const dueDateClass = this.getDueDateClass(task.dueDate);
        const tasksList = document.getElementById('tasksList');
        const isTableView = tasksList && tasksList.classList.contains('table-view');
        
        if (isTableView) {
            return `
                <div class="task-item task-row ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
                    <div class="task-cell task-checkbox-cell">
                        <input type="checkbox" id="task-${task.id}" ${task.completed ? 'checked' : ''}>
                        <label for="task-${task.id}"></label>
                    </div>
                    <div class="task-cell task-title-cell">
                        <div class="task-title">${this.escapeHtml(task.title)}</div>
                    </div>
                    <div class="task-cell task-due-date-cell">
                        ${task.dueDate ? `<span class="task-due-date ${dueDateClass}">
                            <i class="fas fa-calendar"></i>
                            ${dueDate}
                        </span>` : '<span class="no-date">-</span>'}
                    </div>
                    <div class="task-cell task-category-cell">
                        ${task.category ? `<span class="task-category">
                            <i class="fas fa-list"></i>
                            ${this.getListName(task.category)}
                        </span>` : '<span class="no-category">-</span>'}
                    </div>
                    <div class="task-cell task-actions-cell">
                        <button class="task-action-btn important-btn ${task.important ? 'active' : ''}" 
                                title="${task.important ? 'Remove from important' : 'Mark as important'}">
                            <i class="${task.important ? 'fas' : 'far'} fa-star"></i>
                        </button>
                        <button class="task-action-btn delete-btn" title="Delete task">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }
        
        return `
            <div class="task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
                <div class="task-checkbox">
                    <input type="checkbox" id="task-${task.id}" ${task.completed ? 'checked' : ''}>
                    <label for="task-${task.id}"></label>
                </div>
                <div class="task-content">
                    <div class="task-title">${this.escapeHtml(task.title)}</div>
                    <div class="task-meta">
                        ${task.dueDate ? `<span class="task-due-date ${dueDateClass}">
                            <i class="fas fa-calendar"></i>
                            ${dueDate}
                        </span>` : ''}
                        ${task.category ? `<span class="task-category">
                            <i class="fas fa-list"></i>
                            ${this.getListName(task.category)}
                        </span>` : ''}
                    </div>
                </div>
                <div class="task-actions">
                    <button class="task-action-btn important-btn ${task.important ? 'active' : ''}" 
                            title="${task.important ? 'Remove from important' : 'Mark as important'}">
                        <i class="${task.important ? 'fas' : 'far'} fa-star"></i>
                    </button>
                </div>
            </div>
        `;
    }

    bindTaskEvents(container) {
        // Task completion
        container.querySelectorAll('.task-checkbox input').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const taskId = e.target.closest('.task-item').dataset.taskId;
                this.toggleTaskComplete(taskId);
            });
        });

        // Task important toggle
        container.querySelectorAll('.important-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const taskId = e.target.closest('.task-item').dataset.taskId;
                this.toggleTaskImportant(taskId);
            });
        });

        // Task detail view
        container.querySelectorAll('.task-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.closest('.task-checkbox') || e.target.closest('.task-actions')) {
                    return;
                }
                const taskId = item.dataset.taskId;
                this.showTaskDetail(taskId);
            });
        });
    }

    // Filtering and Sorting
    getFilteredTasks() {
        switch (this.currentFilter) {
            case 'important':
                return this.tasks.filter(task => task.important && !task.completed);
            case 'planned':
                return this.tasks.filter(task => task.dueDate && !task.completed);
            case 'completed':
                return this.tasks.filter(task => task.completed);
            case 'all':
                return this.tasks.filter(task => !task.completed);
            default:
                // Handle custom lists
                const customList = this.lists.find(l => l.id === this.currentFilter);
                if (customList) {
                    // For custom lists, we want to show all tasks (both completed and not completed)
                    // The renderTasks method will separate them into active and completed sections
                    const filteredTasks = this.tasks.filter(task => task.category === this.currentFilter);
                    // Debug log to help troubleshoot
                    console.log(`Filtering for list "${customList.name}" (${this.currentFilter}):`, {
                        totalTasks: this.tasks.length,
                        matchingTasks: filteredTasks.length,
                        tasks: filteredTasks.map(t => ({ title: t.title, category: t.category, completed: t.completed }))
                    });
                    return filteredTasks;
                }
                return this.tasks.filter(task => !task.completed);
        }
    }

    getSortedTasks(tasks) {
        const sortedTasks = [...tasks];
        
        switch (this.currentSort) {
            case 'alphabetical':
                return sortedTasks.sort((a, b) => a.title.localeCompare(b.title));
            case 'dueDate':
                return sortedTasks.sort((a, b) => {
                    if (!a.dueDate && !b.dueDate) return 0;
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(a.dueDate) - new Date(b.dueDate);
                });
            case 'important':
                return sortedTasks.sort((a, b) => {
                    if (a.important && !b.important) return -1;
                    if (!a.important && b.important) return 1;
                    return 0;
                });
            case 'created':
                return sortedTasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            case 'default':
            default:
                return sortedTasks.sort((a, b) => {
                    // Important tasks first, then by creation date
                    if (a.important && !b.important) return -1;
                    if (!a.important && b.important) return 1;
                    return new Date(b.createdAt) - new Date(a.createdAt);
                });
        }
    }

    handleSort(e) {
        const sortType = e.target.closest('.sort-option').dataset.sort;
        this.currentSort = sortType;
        this.renderTasks();
        this.hideSortMenu();
        
        // Removed sort notification to reduce noise
    }

    // UI Helpers
    showAddTaskForm() {
        document.getElementById('addTaskBtn').classList.add('hidden');
        document.getElementById('addTaskForm').classList.remove('hidden');
        document.getElementById('taskInput').focus();
        this.populateCategorySelect();
    }

    hideAddTaskForm() {
        document.getElementById('addTaskBtn').classList.remove('hidden');
        document.getElementById('addTaskForm').classList.add('hidden');
        this.resetAddTaskForm();
    }

    resetAddTaskForm() {
        document.getElementById('taskInput').value = '';
        document.getElementById('dueDateInput').value = '';
        document.getElementById('categorySelect').value = '';
        document.getElementById('additionalOptions').classList.add('hidden');
        
        // Reset option buttons
        document.querySelectorAll('.option-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Reset important button icon
        const importantBtn = document.getElementById('importantBtn');
        importantBtn.querySelector('i').className = 'far fa-star';
    }

    toggleDateInput() {
        console.log('toggleDateInput called');
        const btn = document.getElementById('dueDateBtn');
        const options = document.getElementById('additionalOptions');
        const categoryBtn = document.getElementById('categoryBtn');
        
        // Deactivate category button if it's active
        if (categoryBtn.classList.contains('active')) {
            categoryBtn.classList.remove('active');
            document.getElementById('categorySelect').value = '';
        }
        
        btn.classList.toggle('active');
        
        if (btn.classList.contains('active')) {
            options.classList.remove('hidden');
            document.getElementById('dueDateInput').focus();
        } else {
            options.classList.add('hidden');
            document.getElementById('dueDateInput').value = '';
        }
    }

    toggleImportantInput() {
        console.log('toggleImportantInput called');
        const btn = document.getElementById('importantBtn');
        const icon = btn.querySelector('i');
        
        btn.classList.toggle('active');
        icon.className = btn.classList.contains('active') ? 'fas fa-star' : 'far fa-star';
    }

    toggleCategoryInput() {
        console.log('toggleCategoryInput called');
        const btn = document.getElementById('categoryBtn');
        const options = document.getElementById('additionalOptions');
        const dateBtn = document.getElementById('dueDateBtn');
        
        // Deactivate date button if it's active
        if (dateBtn.classList.contains('active')) {
            dateBtn.classList.remove('active');
            document.getElementById('dueDateInput').value = '';
        }
        
        btn.classList.toggle('active');
        
        if (btn.classList.contains('active')) {
            options.classList.remove('hidden');
            document.getElementById('categorySelect').focus();
        } else {
            options.classList.add('hidden');
            document.getElementById('categorySelect').value = '';
        }
    }

    populateCategorySelect() {
        const select = document.getElementById('categorySelect');
        select.innerHTML = '<option value="">Select list</option>';
        
        this.lists.forEach(list => {
            const option = document.createElement('option');
            option.value = list.id;
            option.textContent = list.name;
            select.appendChild(option);
        });

        // Pre-select current list if we're in a custom list
        if (this.currentFilter !== 'all' && this.currentFilter !== 'important' && this.currentFilter !== 'planned' && this.currentFilter !== 'completed') {
            const customList = this.lists.find(l => l.id === this.currentFilter);
            if (customList) {
                select.value = this.currentFilter;
            }
        }
    }

    toggleSortMenu(e) {
        e.stopPropagation();
        const menu = document.getElementById('sortMenu');
        const button = document.getElementById('sortBtn');
        const rect = button.getBoundingClientRect();
        
        menu.style.top = rect.bottom + 'px';
        menu.style.right = (window.innerWidth - rect.right) + 'px';
        
        menu.classList.toggle('hidden');
    }

    hideSortMenu() {
        document.getElementById('sortMenu').classList.add('hidden');
    }

    toggleCompletedTasks() {
        const toggle = document.getElementById('completedToggle');
        const list = document.getElementById('completedTasksList');
        
        toggle.classList.toggle('expanded');
        list.classList.toggle('hidden');
    }

    handleViewChange(e) {
        document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
        e.target.closest('.view-btn').classList.add('active');
        
        this.currentView = e.target.closest('.view-btn').dataset.view;
        
        // Update the view based on selection
        const tasksContainer = document.getElementById('tasksList');
        
        if (this.currentView === 'grid') {
            // Switch to table view
            tasksContainer.classList.add('table-view');
            tasksContainer.classList.remove('list-view');
        } else {
            // Switch to list view (default)
            tasksContainer.classList.add('list-view');
            tasksContainer.classList.remove('table-view');
        }
        
        // Re-render tasks with the new view
        this.renderTasks();
        
        console.log('View changed to:', this.currentView);
    }

    updateEmptyState(isEmpty) {
        const emptyState = document.getElementById('emptyState');
        const tasksContainer = document.getElementById('tasksList');
        
        if (isEmpty && this.currentFilter === 'all') {
            emptyState.classList.remove('hidden');
            tasksContainer.style.display = 'none';
        } else {
            emptyState.classList.add('hidden');
            tasksContainer.style.display = 'block';
        }
    }

    // Custom Lists
    showAddListModal() {
        // Close any existing modals first
        this.closeModal();
        
        this.editingListId = null;
        this.selectedColor = '#0078d4';
        document.getElementById('listModalTitle').textContent = 'Create new list';
        document.getElementById('createListBtn').textContent = 'Create';
        document.getElementById('newListInput').value = '';
        
        // Reset color selection
        document.querySelectorAll('.color-option').forEach(option => {
            option.classList.remove('selected');
        });
        document.querySelector('.color-option[data-color="#0078d4"]').classList.add('selected');
        
        document.getElementById('addListModal').classList.remove('hidden');
        document.getElementById('modalOverlay').classList.remove('hidden');
        document.getElementById('newListInput').focus();
    }

    showEditListModal(listId) {
        const list = this.lists.find(l => l.id === listId);
        if (!list) return;

        this.editingListId = listId;
        this.selectedColor = list.color;
        document.getElementById('listModalTitle').textContent = 'Edit list';
        document.getElementById('createListBtn').textContent = 'Save';
        document.getElementById('newListInput').value = list.name;
        
        // Set color selection
        document.querySelectorAll('.color-option').forEach(option => {
            option.classList.remove('selected');
        });
        document.querySelector(`[data-color="${list.color}"]`).classList.add('selected');
        
        document.getElementById('addListModal').classList.remove('hidden');
        document.getElementById('modalOverlay').classList.remove('hidden');
        document.getElementById('newListInput').focus();
        document.getElementById('newListInput').select();
    }

    selectColor(e) {
        document.querySelectorAll('.color-option').forEach(option => {
            option.classList.remove('selected');
        });
        e.target.classList.add('selected');
        this.selectedColor = e.target.dataset.color;
    }

    saveCustomList() {
        const input = document.getElementById('newListInput');
        const name = input.value.trim();
        
        if (!name) {
            this.showNotification('Please enter a list name', 'error');
            return;
        }

        if (name.length > 50) {
            this.showNotification('List name is too long (max 50 characters)', 'error');
            return;
        }

        // Check for duplicate names (excluding the current list being edited)
        const existingList = this.lists.find(list => 
            list.name.toLowerCase() === name.toLowerCase() && 
            list.id !== this.editingListId
        );
        
        if (existingList) {
            this.showNotification('A list with this name already exists', 'error');
            return;
        }

        if (this.editingListId) {
            // Edit existing list
            const list = this.lists.find(l => l.id === this.editingListId);
            if (list) {
                list.name = name;
                list.color = this.selectedColor;
                this.showNotification(`List "${name}" updated`, 'success');
            }
        } else {
            // Create new list
            const list = {
                id: this.generateId(),
                name: name,
                color: this.selectedColor
            };

            this.lists.push(list);
            this.showNotification(`List "${name}" created`, 'success');
        }

        this.saveToStorage();
        this.renderCustomLists();
        this.updateTaskCounts();
        this.closeModal();
        input.value = '';
    }

    showDeleteListModal(listId) {
        const list = this.lists.find(l => l.id === listId);
        if (!list) return;

        const taskCount = this.tasks.filter(t => t.category === listId).length;
        const warningText = taskCount > 0 
            ? `This will delete ${taskCount} task${taskCount === 1 ? '' : 's'} in this list.`
            : 'This list is empty.';
        
        document.getElementById('deleteListWarning').textContent = warningText;
        document.getElementById('deleteListModal').classList.remove('hidden');
        document.getElementById('modalOverlay').classList.remove('hidden');
        
        // Store the list ID for deletion
        this.listToDelete = listId;
    }

    deleteCustomList() {
        if (!this.listToDelete) return;

        const list = this.lists.find(l => l.id === this.listToDelete);
        if (!list) return;

        // Remove all tasks in this list
        this.tasks = this.tasks.filter(t => t.category !== this.listToDelete);
        
        // Remove the list
        this.lists = this.lists.filter(l => l.id !== this.listToDelete);
        
        // If we're currently viewing this list, switch to "My Day"
        if (this.currentFilter === this.listToDelete) {
            this.currentFilter = 'all';
            document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
            document.querySelector('[data-filter="all"]').classList.add('active');
            this.updateCurrentListTitle();
        }

        this.saveToStorage();
        this.renderCustomLists();
        this.renderTasks();
        this.updateTaskCounts();
        this.closeModal();
        
        this.showNotification(`List "${list.name}" deleted`, 'success');
        this.listToDelete = null;
    }

    renderCustomLists() {
        const container = document.getElementById('customLists');
        const customLists = this.lists.slice(3); // Skip default lists
        
        container.innerHTML = customLists.map(list => `
            <li class="nav-item custom-list-item custom-list-nav-item" data-filter="${list.id}">
                <div class="list-content">
                    <div class="list-color-indicator" style="background-color: ${list.color}"></div>
                    <i class="fas fa-list" style="color: ${list.color}"></i>
                    <span>${this.escapeHtml(list.name)}</span>
                </div>
                <span class="task-count">0</span>
                <div class="list-actions">
                    <button class="list-action-btn edit-btn" title="Edit list" data-list-id="${list.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="list-action-btn delete-btn" title="Delete list" data-list-id="${list.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                </div>
            </li>
        `).join('');

        // Bind events for custom lists
        container.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                // Don't trigger navigation if clicking on action buttons
                if (e.target.closest('.list-actions')) return;
                this.handleNavigation(e);
            });
        });

        // Bind events for edit/delete buttons
        container.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const listId = btn.dataset.listId;
                this.showEditListModal(listId);
            });
        });

        container.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const listId = btn.dataset.listId;
                this.showDeleteListModal(listId);
            });
        });

        // Update task counts after rendering custom lists
        this.updateTaskCounts();
    }

    // Task Counts
    updateTaskCounts() {
        const counts = {
            all: this.tasks.filter(t => !t.completed).length,
            important: this.tasks.filter(t => t.important && !t.completed).length,
            planned: this.tasks.filter(t => t.dueDate && !t.completed).length,
            completed: this.tasks.filter(t => t.completed).length
        };

        document.getElementById('allCount').textContent = counts.all;
        document.getElementById('importantCount').textContent = counts.important;
        document.getElementById('plannedCount').textContent = counts.planned;
        document.getElementById('completedCount').textContent = counts.completed;

        // Update custom list counts
        this.lists.forEach(list => {
            const count = this.tasks.filter(t => t.category === list.id && !t.completed).length;
            const element = document.querySelector(`[data-filter="${list.id}"] .task-count`);
            if (element) {
                element.textContent = count;
            }
        });
    }

    // Utility Functions
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    formatDueDate(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        if (this.isSameDay(date, today)) {
            return 'Today';
        } else if (this.isSameDay(date, tomorrow)) {
            return 'Tomorrow';
        } else {
            return date.toLocaleDateString();
        }
    }

    getDueDateClass(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        const today = new Date();
        
        if (date < today && !this.isSameDay(date, today)) {
            return 'overdue';
        } else if (this.isSameDay(date, today)) {
            return 'today';
        }
        
        return '';
    }

    isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }

    updateCurrentDate() {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', options);
    }

    getListName(listId) {
        const list = this.lists.find(l => l.id === listId);
        return list ? list.name : 'Unknown';
    }

    getRandomColor() {
        const colors = ['#0078d4', '#00bcf2', '#00b7c3', '#40e0d0', '#107c10', '#00cc6a', '#10893e', '#7a7574', '#69797e', '#4c4a48'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Mobile UI
    toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.getElementById('overlay');
        const isOpen = sidebar.classList.toggle('open');
        
        if (isOpen) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }

    closeSidebar() {
        if (window.innerWidth <= 768) {
            document.querySelector('.sidebar').classList.remove('open');
            document.getElementById('overlay').classList.add('hidden');
        }
    }

    // Modal Management
    showDeleteConfirmation() {
        document.getElementById('deleteConfirmModal').classList.remove('hidden');
        document.getElementById('modalOverlay').classList.remove('hidden');
    }

    closeModal() {
        document.getElementById('modalOverlay').classList.add('hidden');
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.add('hidden');
        });
        
        // Reset form states
        this.editingListId = null;
        this.listToDelete = null;
        this.selectedColor = '#0078d4';
    }

    // Event Handlers
    handleOutsideClick(e) {
        // Close sort menu
        if (!e.target.closest('#sortBtn') && !e.target.closest('#sortMenu')) {
            this.hideSortMenu();
        }
    }

    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + N: New task
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            this.showAddTaskForm();
        }
        
        // Escape: Close modals/panels
        if (e.key === 'Escape') {
            if (!document.getElementById('modalOverlay').classList.contains('hidden')) {
                this.closeModal();
            } else if (!document.getElementById('taskDetailPanel').classList.contains('hidden')) {
                this.closeTaskDetail();
            } else if (!document.getElementById('addTaskForm').classList.contains('hidden')) {
                this.hideAddTaskForm();
            }
        }
    }

    // Notifications
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        // Add icon based on type
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle',
            warning: 'fas fa-exclamation-circle'
        };
        
        notification.innerHTML = `
            <i class="${icons[type]}"></i>
            <span>${message}</span>
        `;
        
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '16px 24px',
            borderRadius: '12px',
            color: '#ffffff',
            fontWeight: '700',
            fontSize: '14px',
            zIndex: '9999',
            transform: 'translateX(100%) scale(0.8)',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            maxWidth: '350px',
            minWidth: '200px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6), 0 4px 16px rgba(0, 0, 0, 0.3)',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
        });

        // Set background color based on type
        const colors = {
            success: 'linear-gradient(135deg, #28a745 0%, #155724 100%)',
            error: 'linear-gradient(135deg, #dc3545 0%, #721c24 100%)',
            info: 'linear-gradient(135deg, #007bff 0%, #004085 100%)',
            warning: 'linear-gradient(135deg, #ffc107 0%, #856404 100%)'
        };
        notification.style.background = colors[type] || colors.info;
        notification.style.color = '#ffffff';
        notification.style.textShadow = '0 2px 4px rgba(0, 0, 0, 0.7)';

        // Add to DOM and animate
        document.body.appendChild(notification);
        
        // Trigger entrance animation
        setTimeout(() => {
            notification.style.transform = 'translateX(0) scale(1)';
        }, 100);

        // Add click to dismiss
        notification.addEventListener('click', () => {
            notification.style.transform = 'translateX(100%) scale(0.8)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 400);
        });

        // Auto remove after 4 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.transform = 'translateX(100%) scale(0.8)';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 400);
            }
        }, 4000);

        // Add ripple effect
        this.addRippleEffect(notification);
    }

    // Add ripple effect to elements
    addRippleEffect(element) {
        element.addEventListener('click', (e) => {
            const ripple = document.createElement('span');
            const rect = element.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s ease-out;
                pointer-events: none;
            `;
            
            element.style.position = 'relative';
            element.style.overflow = 'hidden';
            element.appendChild(ripple);
            
            setTimeout(() => {
                if (ripple.parentNode) {
                    ripple.parentNode.removeChild(ripple);
                }
            }, 600);
        });
    }

    // Add CSS for ripple animation
    addRippleCSS() {
        if (!document.getElementById('ripple-styles')) {
            const style = document.createElement('style');
            style.id = 'ripple-styles';
            style.textContent = `
                @keyframes ripple {
                    from {
                        transform: scale(0);
                        opacity: 1;
                    }
                    to {
                        transform: scale(1);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Local Storage
    saveToStorage() {
        try {
            const data = {
                tasks: this.tasks,
                lists: this.lists,
                // Don't save currentFilter to always start with 'all' (My Day)
                currentSort: this.currentSort,
                version: '1.0'
            };
            localStorage.setItem('todoApp', JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
            this.showNotification('Failed to save data', 'error');
        }
    }

    loadFromStorage() {
        try {
            const data = localStorage.getItem('todoApp');
            if (data) {
                const parsed = JSON.parse(data);
                this.tasks = parsed.tasks || [];
                this.lists = parsed.lists || this.lists;
                // Always start with 'all' filter to show My Day by default
                this.currentFilter = 'all';
                this.currentSort = parsed.currentSort || 'default';
                this.editingListId = null;
                this.selectedColor = '#0078d4';
            }
        } catch (error) {
            console.error('Failed to load from localStorage:', error);
            this.showNotification('Failed to load saved data', 'error');
        }
    }

    // Initial UI Render
    renderUI() {
        this.renderCustomLists();
        this.renderTasks();
        this.updateTaskCounts();
        this.updateCurrentListTitle();
        
        // Clear all active nav items first, then set the correct one
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        const activeNavItem = document.querySelector(`[data-filter="${this.currentFilter}"]`);
        if (activeNavItem) {
            activeNavItem.classList.add('active');
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TodoApp();
});

// Service Worker Registration (for offline capability)
// Commented out to prevent CORS errors when running from file system
/*
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
*/
