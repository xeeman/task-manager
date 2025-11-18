// ===== TASK MANAGER APPLICATION =====
// A complete task management application with local storage persistence

class TaskManager {
    constructor() {
        // Initialize state
        this.tasks = this.loadTasks();
        this.currentFilter = 'all';
        
        // Cache DOM elements
        this.taskForm = document.getElementById('taskForm');
        this.taskInput = document.getElementById('taskInput');
        this.taskList = document.getElementById('taskList');
        this.emptyState = document.getElementById('emptyState');
        this.clearCompletedBtn = document.getElementById('clearCompleted');
        this.filterButtons = document.querySelectorAll('.filter-btn');
        this.darkModeToggle = document.getElementById('darkModeToggle');
        
        // Stats elements
        this.totalTasksEl = document.getElementById('totalTasks');
        this.activeTasksEl = document.getElementById('activeTasks');
        this.completedTasksEl = document.getElementById('completedTasks');
        
        // Initialize event listeners
        this.initEventListeners();
        
        // Initialize dark mode
        this.initDarkMode();
        
        // Initial render
        this.render();
    }
    
    // ===== EVENT LISTENERS =====
    initEventListeners() {
        // Form submission
        this.taskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask();
        });
        
        // Filter buttons
        this.filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });
        
        // Clear completed button
        this.clearCompletedBtn.addEventListener('click', () => {
            this.clearCompleted();
        });
        
        // Dark mode toggle
        this.darkModeToggle.addEventListener('click', () => {
            this.toggleDarkMode();
        });
        
        // Keyboard accessibility for task list
        this.taskList.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                if (e.target.classList.contains('task-checkbox')) {
                    e.preventDefault();
                    e.target.click();
                } else if (e.target.classList.contains('delete-btn')) {
                    e.preventDefault();
                    e.target.click();
                }
            }
        });
    }
    
    // ===== TASK OPERATIONS =====
    
    /**
     * Add a new task
     */
    /**
     * Add a new task
     */
    addTask() {
        // Normalize whitespace and trim
        const raw = this.taskInput.value || '';
        const text = raw.replace(/\s+/g, ' ').trim();
        
        // Prevent empty tasks
        if (text === '') {
            // Clear input, focus, and announce for accessibility
            this.taskInput.value = '';
            this.taskInput.focus();
            this.announceToScreenReader('Cannot add an empty task.');
            return;
        }
        
        // Optional: limit task length
        const MAX_LENGTH = 200;
        if (text.length > MAX_LENGTH) {
            this.announceToScreenReader(`Task is too long. Limit to ${MAX_LENGTH} characters.`);
            this.taskInput.focus();
            return;
        }
        
        const task = {
            id: Date.now().toString(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        this.tasks.unshift(task);
        this.saveTasks();
        this.render();
        
        // Clear input and focus
        this.taskInput.value = '';
        this.taskInput.focus();
        
        // Announce to screen readers
        this.announceToScreenReader(`Task added: ${text}`);
    }
    
    /**
     * Toggle task completion status
     * @param {string} id - Task ID
     */
    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.render();
            
            const status = task.completed ? 'completed' : 'active';
            this.announceToScreenReader(`Task marked as ${status}: ${task.text}`);
        }
    }
    
    /**
     * Delete a task
     * @param {string} id - Task ID
     */
    deleteTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            this.tasks = this.tasks.filter(t => t.id !== id);
            this.saveTasks();
            this.render();
            
            this.announceToScreenReader(`Task deleted: ${task.text}`);
        }
    }
    
    /**
     * Clear all completed tasks
     */
    clearCompleted() {
        const completedCount = this.tasks.filter(t => t.completed).length;
        
        if (completedCount === 0) {
            return;
        }
        
        if (confirm(`Delete ${completedCount} completed task(s)?`)) {
            this.tasks = this.tasks.filter(t => !t.completed);
            this.saveTasks();
            this.render();
            
            this.announceToScreenReader(`${completedCount} completed tasks deleted`);
        }
    }
    
    // ===== FILTERING =====
    
    /**
     * Set the current filter
     * @param {string} filter - Filter type: 'all', 'active', or 'completed'
     */
    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active filter button
        this.filterButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        
        this.render();
    }
    
    /**
     * Get filtered tasks based on current filter
     * @returns {Array} Filtered tasks
     */
    getFilteredTasks() {
        switch (this.currentFilter) {
            case 'active':
                return this.tasks.filter(t => !t.completed);
            case 'completed':
                return this.tasks.filter(t => t.completed);
            default:
                return this.tasks;
        }
    }
    
    // ===== RENDERING =====
    
    /**
     * Render the entire task list
     */
    render() {
        const filteredTasks = this.getFilteredTasks();
        
        // Clear task list
        this.taskList.innerHTML = '';
        
        // Show/hide empty state
        if (filteredTasks.length === 0) {
            this.emptyState.classList.remove('hidden');
            this.taskList.setAttribute('aria-label', 'No tasks to display');
        } else {
            this.emptyState.classList.add('hidden');
            this.taskList.setAttribute('aria-label', `${filteredTasks.length} task(s)`);
            
            // Render each task
            filteredTasks.forEach(task => {
                this.taskList.appendChild(this.createTaskElement(task));
            });
        }
        
        // Update stats
        this.updateStats();
        
        // Update clear completed button
        const completedCount = this.tasks.filter(t => t.completed).length;
        this.clearCompletedBtn.disabled = completedCount === 0;
    }
    
    /**
     * Create a task DOM element
     * @param {Object} task - Task object
     * @returns {HTMLElement} Task list item
     */
    createTaskElement(task) {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.setAttribute('role', 'listitem');
        
        // Checkbox
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'task-checkbox';
        checkbox.checked = task.completed;
        checkbox.id = `task-${task.id}`;
        checkbox.setAttribute('aria-label', `Mark task as ${task.completed ? 'incomplete' : 'complete'}`);
        checkbox.addEventListener('change', () => this.toggleTask(task.id));
        
        // Task text
        const label = document.createElement('label');
        label.className = 'task-text';
        label.htmlFor = `task-${task.id}`;
        label.textContent = task.text;
        
        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '×';
        deleteBtn.setAttribute('aria-label', `Delete task: ${task.text}`);
        deleteBtn.addEventListener('click', () => this.deleteTask(task.id));
        
        // Assemble the task item
        li.appendChild(checkbox);
        li.appendChild(label);
        li.appendChild(deleteBtn);
        
        return li;
    }
    
    /**
     * Update statistics display
     */
    updateStats() {
        const total = this.tasks.length;
        const active = this.tasks.filter(t => !t.completed).length;
        const completed = this.tasks.filter(t => t.completed).length;
        
        this.totalTasksEl.textContent = total;
        this.activeTasksEl.textContent = active;
        this.completedTasksEl.textContent = completed;
        
        // Update aria-labels for stats
        document.querySelector('#totalTasks').closest('.stat-item')
            .setAttribute('aria-label', `Total tasks: ${total}`);
        document.querySelector('#activeTasks').closest('.stat-item')
            .setAttribute('aria-label', `Active tasks: ${active}`);
        document.querySelector('#completedTasks').closest('.stat-item')
            .setAttribute('aria-label', `Completed tasks: ${completed}`);
    }
    
    // ===== DARK MODE =====
    
    /**
     * Initialize dark mode based on saved preference or system preference
     */
    initDarkMode() {
        const savedTheme = localStorage.getItem('theme');
        
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            document.body.classList.remove('light-mode');
        } else if (savedTheme === 'light') {
            document.body.classList.add('light-mode');
            document.body.classList.remove('dark-mode');
        } else {
            // Check system preference
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.body.classList.remove('light-mode');
                // Don't add dark-mode class, let CSS handle it via media query
            }
        }
    }
    
    /**
     * Toggle dark mode
     */
    toggleDarkMode() {
        const isDarkMode = document.body.classList.contains('dark-mode');
        const hasLightMode = document.body.classList.contains('light-mode');
        
        if (isDarkMode) {
            // Switch to light mode
            document.body.classList.remove('dark-mode');
            document.body.classList.add('light-mode');
            localStorage.setItem('theme', 'light');
            this.announceToScreenReader('Light mode activated');
        } else if (hasLightMode) {
            // Switch to dark mode
            document.body.classList.remove('light-mode');
            document.body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark');
            this.announceToScreenReader('Dark mode activated');
        } else {
            // Currently using system preference, toggle to opposite
            const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            
            if (systemPrefersDark) {
                // System prefers dark, switch to light
                document.body.classList.add('light-mode');
                localStorage.setItem('theme', 'light');
                this.announceToScreenReader('Light mode activated');
            } else {
                // System prefers light, switch to dark
                document.body.classList.add('dark-mode');
                localStorage.setItem('theme', 'dark');
                this.announceToScreenReader('Dark mode activated');
            }
        }
    }
    
    // ===== LOCAL STORAGE =====
    
    /**
     * Load tasks from local storage
     * @returns {Array} Array of tasks
     */
    loadTasks() {
        try {
            const tasksJSON = localStorage.getItem('tasks');
            return tasksJSON ? JSON.parse(tasksJSON) : [];
        } catch (error) {
            console.error('Error loading tasks from local storage:', error);
            return [];
        }
    }
    
    /**
     * Save tasks to local storage
     */
    saveTasks() {
        try {
            localStorage.setItem('tasks', JSON.stringify(this.tasks));
        } catch (error) {
            console.error('Error saving tasks to local storage:', error);
        }
    }
    
    // ===== ACCESSIBILITY =====
    
    /**
     * Announce message to screen readers
     * @param {string} message - Message to announce
     */
    announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('role', 'status');
        announcement.setAttribute('aria-live', 'polite');
        announcement.className = 'visually-hidden';
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        
        // Remove after announcement
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }
}

// ===== INITIALIZE APPLICATION =====
// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const taskManager = new TaskManager();
    
    // Make taskManager available globally for debugging (optional)
    if (typeof window !== 'undefined') {
        window.taskManager = taskManager;
    }
});

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', (e) => {
    // Focus input with Ctrl/Cmd + K
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('taskInput').focus();
    }
});
