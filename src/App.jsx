import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, BookOpen, Sun, Moon, Share2, Copy, Menu, Edit, Save, RotateCcw, LogOut, Lock, User, Key, Users, Trash2, CheckSquare, Square, X, Plus, GraduationCap, School, MinusCircle, Settings, List, Clock, Clipboard, FileText, Grid, Layout, CheckCircle, AlertCircle, Link, Check, XCircle, BarChart3, FileBarChart } from 'lucide-react';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, doc, onSnapshot, setDoc, getDoc, serverTimestamp, collection, addDoc, getDocs, deleteDoc, updateDoc } from "firebase/firestore";

// --- Configuración de Firebase ---
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// FIX: Sanitizar appId para evitar errores de segmentos en Firestore
const rawAppId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const appId = rawAppId.replace(/[\/.]/g, '_'); 

// --- Constantes del Sistema ---
const ROLES = {
  ADMIN: 'Administrador',
  ADMINISTRATIVE: 'Administrativo',
  TEACHER: 'Docente',
  DIRECTOR: 'Director de Área'
};

const DAYS_OF_WEEK = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const DEFAULT_CONFIG = {
  sections: ['Sección Primaria', 'Sección Secundaria'],
  courses: ["8vo EGB", "9no EGB", "10mo EGB", "1ro Bachillerato", "2do Bachillerato", "3ro Bachillerato"],
  parallels: ["A", "B", "C", "D", "E"],
  subjects: ["Matemáticas", "Lengua y Literatura", "Ciencias Naturales", "Estudios Sociales", "Inglés", "Educación Física"],
  scheduleTemplates: [
    {
      id: 'default_sec',
      name: 'Secundaria (Matutina)',
      slots: [
        { id: 't1', label: "1ª Hora", start: "07:00", end: "07:40" },
        { id: 't2', label: "2ª Hora", start: "07:40", end: "08:20" },
        { id: 't3', label: "3ª Hora", start: "08:20", end: "09:00" },
        { id: 't4', label: "Receso",  start: "09:00", end: "09:30" },
        { id: 't5', label: "4ª Hora", start: "09:30", end: "10:10" },
        { id: 't6', label: "5ª Hora", start: "10:10", end: "10:50" },
        { id: 't7', label: "6ª Hora", start: "10:50", end: "11:30" }
      ]
    }
  ],
  courseSchedules: {}
};

// --- Componentes UI ---

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!message) return null;
  const bgClass = type === 'error' ? 'bg-red-600' : 'bg-slate-800';

  return (
    <div className={`fixed bottom-6 right-6 ${bgClass} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in slide-in-from-bottom-5 z-[100]`}>
      {type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
      <span className="font-medium text-sm">{typeof message === 'string' ? message : 'Notificación'}</span>
      <button onClick={onClose}><X size={16} className="opacity-70 hover:opacity-100"/></button>
    </div>
  );
};

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 transform scale-100 animate-in zoom-in-95 duration-200">
        <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
        <p className="text-slate-600 text-sm mb-6 leading-relaxed">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg font-medium text-sm transition-colors">Cancelar</button>
          <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm transition-colors shadow-sm">Eliminar</button>
        </div>
      </div>
    </div>
  );
};

const ConfigList = ({ title, type, items, onAdd, onDelete, onEdit }) => {
  const [inputValue, setInputValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editValue, setEditValue] = useState('');

  const handleAdd = async () => {
    if (inputValue.trim()) {
      setIsSaving(true);
      await onAdd(type, inputValue);
      setInputValue('');
      setIsSaving(false);
    }
  };

  const startEdit = (item) => { setEditingItem(item); setEditValue(String(item)); };
  const saveEdit = async () => { 
    if (editValue.trim() && editValue !== editingItem) { await onEdit(type, editingItem, editValue); } 
    setEditingItem(null); 
  };

  return (
    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 h-full flex flex-col shadow-sm">
      <h4 className="font-bold text-slate-700 mb-2 text-xs uppercase flex items-center gap-2"><List size={14}/> {title}</h4>
      <div className="flex gap-2 mb-2">
        <input className="flex-1 p-1.5 text-xs border rounded outline-none focus:border-blue-500" placeholder="Nuevo..." value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} />
        <button onClick={handleAdd} disabled={isSaving} className="bg-green-600 text-white p-1.5 rounded hover:bg-green-700 disabled:opacity-50 transition-colors">
          {isSaving ? <RotateCcw className="animate-spin" size={14}/> : <Plus size={14}/>}
        </button>
      </div>
      <div className="space-y-1 overflow-y-auto flex-1 max-h-48 pr-1">
        {items.map((item, i) => (
          <div key={i} className="flex justify-between items-center bg-white p-2 rounded border border-slate-100 text-xs hover:bg-blue-50 transition-colors group">
            {editingItem === item ? (
              <div className="flex items-center gap-1 w-full animate-in fade-in">
                <input className="flex-1 p-1 border rounded bg-white outline-none focus:ring-1 ring-blue-300" value={editValue} onChange={e => setEditValue(e.target.value)} autoFocus />
                <button onClick={saveEdit} className="text-green-600 hover:bg-green-50 p-1 rounded"><Check size={14}/></button>
                <button onClick={() => setEditingItem(null)} className="text-slate-400 hover:bg-slate-100 p-1 rounded"><XCircle size={14}/></button>
              </div>
            ) : (
              <>
                <span className="truncate flex-1" title={String(item)}>{String(item)}</span>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(item)} className="text-blue-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50 transition-colors" title="Editar"><Edit size={12}/></button>
                  <button onClick={() => onDelete(type, item)} className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors" title="Eliminar"><Trash2 size={12}/></button>
                </div>
              </>
            )}
          </div>
        ))}
        {items.length === 0 && <p className="text-center text-xs text-slate-400 italic py-4">Sin elementos</p>}
      </div>
    </div>
  );
};

const ScheduleTemplateManager = ({ templates, onSaveTemplates, onDeleteTemplate }) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState(templates[0]?.id || null);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newSlot, setNewSlot] = useState({ label: '', start: '', end: '' });
  const [editingSlotId, setEditingSlotId] = useState(null);
  const [editSlotData, setEditSlotData] = useState({ label: '', start: '', end: '' });

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  const handleAddTemplate = () => {
    if (!newTemplateName.trim()) return;
    const newTmpl = { id: crypto.randomUUID(), name: newTemplateName, slots: [] };
    onSaveTemplates([...templates, newTmpl]);
    setNewTemplateName('');
    setSelectedTemplateId(newTmpl.id);
  };

  const handleDeleteTemplate = (id) => onDeleteTemplate(id);

  const handleAddSlot = () => {
    if (!selectedTemplate || !newSlot.label || !newSlot.start || !newSlot.end) return; 
    const updatedTemplate = { ...selectedTemplate, slots: [...selectedTemplate.slots, { ...newSlot, id: crypto.randomUUID() }] };
    onSaveTemplates(templates.map(t => t.id === selectedTemplateId ? updatedTemplate : t));
    setNewSlot({ label: '', start: '', end: '' });
  };

  const startEditSlot = (slot) => { setEditingSlotId(slot.id); setEditSlotData({ label: slot.label, start: slot.start, end: slot.end }); };
  const saveEditSlot = () => {
    const updatedSlots = selectedTemplate.slots.map(s => s.id === editingSlotId ? { ...s, ...editSlotData } : s);
    onSaveTemplates(templates.map(t => t.id === selectedTemplateId ? { ...selectedTemplate, slots: updatedSlots } : t));
    setEditingSlotId(null);
  };
  const handleDeleteSlot = (slotId) => {
    const updatedTemplate = { ...selectedTemplate, slots: selectedTemplate.slots.filter(s => s.id !== slotId) };
    onSaveTemplates(templates.map(t => t.id === selectedTemplateId ? updatedTemplate : t));
  };

  return (
    <div className="col-span-1 md:col-span-2 lg:col-span-4 grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4 mt-2">
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
        <h4 className="font-bold text-slate-700 mb-3 text-sm uppercase flex items-center gap-2"><Clock size={16}/> Plantillas de Horario</h4>
        <div className="flex gap-2 mb-3"><input className="w-full p-2 text-xs border rounded" placeholder="Nombre (Ej: Matutina)" value={newTemplateName} onChange={e => setNewTemplateName(e.target.value)} /><button onClick={handleAddTemplate} className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700"><Plus size={16}/></button></div>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {templates.map(t => (<div key={t.id} onClick={() => setSelectedTemplateId(t.id)} className={`flex justify-between items-center p-2 rounded cursor-pointer text-xs border transition-all ${selectedTemplateId === t.id ? 'bg-blue-100 border-blue-300 text-blue-800 font-bold' : 'bg-white border-slate-200 hover:bg-slate-100'}`}><span>{t.name}</span><button onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(t.id); }} className="text-red-400 hover:text-red-600"><Trash2 size={12}/></button></div>))}
        </div>
      </div>
      <div className="md:col-span-2 bg-white p-4 rounded-lg border border-slate-200 flex flex-col">
        {selectedTemplate ? (
          <>
            <div className="mb-3 flex justify-between items-center border-b pb-2"><h5 className="font-bold text-slate-700 text-sm">Bloques Horarios: <span className="text-blue-600">{selectedTemplate.name}</span></h5></div>
            <div className="flex flex-wrap gap-2 mb-3 items-end bg-slate-50 p-2 rounded">
              <div className="flex-1"><label className="text-[10px] font-bold text-slate-400">Nombre</label><input className="w-full p-1.5 text-xs border rounded" value={newSlot.label} onChange={e => setNewSlot({...newSlot, label: e.target.value})} placeholder="Ej: 1ª Hora" /></div>
              <div className="w-20"><label className="text-[10px] font-bold text-slate-400">Inicio</label><input type="time" className="w-full p-1.5 text-xs border rounded" value={newSlot.start} onChange={e => setNewSlot({...newSlot, start: e.target.value})} /></div>
              <div className="w-20"><label className="text-[10px] font-bold text-slate-400">Fin</label><input type="time" className="w-full p-1.5 text-xs border rounded" value={newSlot.end} onChange={e => setNewSlot({...newSlot, end: e.target.value})} /></div>
              <button onClick={handleAddSlot} className="bg-green-600 text-white px-3 py-1.5 rounded text-xs hover:bg-green-700 font-bold h-[30px]">Añadir</button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 overflow-y-auto flex-1 max-h-48">
              {selectedTemplate.slots.sort((a,b) => a.start.localeCompare(b.start)).map(slot => (
                <div key={slot.id} className="bg-slate-50 p-2 rounded border border-slate-100 text-xs hover:bg-white transition-colors">
                  {editingSlotId === slot.id ? (
                    <div className="flex items-center gap-1"><input className="flex-1 p-1 border rounded w-16" value={editSlotData.label} onChange={e => setEditSlotData({...editSlotData, label: e.target.value})} /><input type="time" className="p-1 border rounded w-16" value={editSlotData.start} onChange={e => setEditSlotData({...editSlotData, start: e.target.value})} /><input type="time" className="p-1 border rounded w-16" value={editSlotData.end} onChange={e => setEditSlotData({...editSlotData, end: e.target.value})} /><button onClick={saveEditSlot} className="text-green-600"><Check size={14}/></button><button onClick={() => setEditingSlotId(null)} className="text-slate-400"><XCircle size={14}/></button></div>
                  ) : (
                    <div className="flex justify-between items-center"><div><span className="font-bold text-slate-700 mr-2">{slot.label}</span><span className="text-slate-500">{slot.start} - {slot.end}</span></div><div className="flex gap-1"><button onClick={() => startEditSlot(slot)} className="text-blue-400 hover:text-blue-600"><Edit size={12}/></button><button onClick={() => handleDeleteSlot(slot.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={12}/></button></div></div>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : <div className="flex items-center justify-center h-full text-slate-400 italic">Selecciona una plantilla</div>}
      </div>
    </div>
  );
};

const CourseScheduleMapper = ({ courses, templates, assignments, onSaveAssignment }) => {
  return (
    <div className="col-span-1 md:col-span-2 lg:col-span-4 bg-slate-50 p-4 rounded-lg border border-slate-200 mt-4">
      <h4 className="font-bold text-slate-700 mb-3 text-sm uppercase flex items-center gap-2"><Link size={16}/> Asignar Plantilla a Cursos</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {courses.map(course => {
          const assignedTmplId = assignments[course] || (templates[0]?.id);
          return (
            <div key={course} className="bg-white p-2 rounded border border-slate-200 flex items-center justify-between text-xs hover:shadow-sm transition-shadow">
              <span className="font-bold text-slate-700 truncate w-1/3" title={course}>{course}</span>
              <select className="w-2/3 p-1 border rounded text-slate-600 outline-none focus:border-blue-500 cursor-pointer" value={assignedTmplId} onChange={(e) => onSaveAssignment(course, e.target.value)}>
                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ReportsPanel = ({ onClose, usersList, config }) => {
  const [filterCourse, setFilterCourse] = useState(config.courses[0] || '');
  const [filterParallel, setFilterParallel] = useState(config.parallels[0] || '');

  const generateCourseReport = () => {
    const reportData = {};
    config.subjects.forEach(sub => reportData[sub] = 0);
    usersList.forEach(user => {
      user.schedule?.forEach(slot => {
        if (slot.course === filterCourse && slot.parallel === filterParallel) {
          if (!reportData[slot.subject]) reportData[slot.subject] = 0;
          reportData[slot.subject]++;
        }
      });
    });
    return Object.entries(reportData).filter(([_, count]) => count > 0);
  };

  const reportData = generateCourseReport();
  const totalHours = reportData.reduce((acc, [_, count]) => acc + count, 0);

  return (
    <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="p-4 border-b flex justify-between items-center bg-emerald-50 rounded-t-xl">
          <h2 className="font-bold text-emerald-800 flex items-center gap-2"><FileBarChart size={18}/> Reportes Académicos</h2>
          <button onClick={onClose} className="p-1 hover:bg-emerald-100 rounded-full"><X size={20}/></button>
        </div>
        <div className="p-4 bg-slate-50 border-b flex gap-4 items-center">
           <span className="text-sm font-bold text-slate-600">Filtrar:</span>
           <select className="p-2 border rounded text-sm bg-white" value={filterCourse} onChange={e => setFilterCourse(e.target.value)}>{config.courses.map(c => <option key={c} value={c}>{c}</option>)}</select>
           <select className="p-2 border rounded text-sm bg-white" value={filterParallel} onChange={e => setFilterParallel(e.target.value)}>{config.parallels.map(p => <option key={p} value={p}>Paralelo {p}</option>)}</select>
        </div>
        <div className="p-6 overflow-y-auto">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Carga Horaria Semanal</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-100 text-slate-600"><tr><th className="p-3">Materia</th><th className="p-3 text-right">Horas</th></tr></thead>
                  <tbody className="divide-y">{reportData.map(([subject, count]) => (<tr key={subject}><td className="p-3 font-medium text-slate-700">{subject}</td><td className="p-3 text-right font-bold text-blue-600">{count}</td></tr>))}
                    {reportData.length === 0 && <tr><td colSpan="2" className="p-4 text-center text-slate-400">No hay horas asignadas.</td></tr>}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold text-slate-800"><tr><td className="p-3">TOTAL</td><td className="p-3 text-right">{totalHours}</td></tr></tfoot>
                </table>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex flex-col justify-center items-center text-center">
                <div className="w-24 h-24 rounded-full bg-white border-4 border-blue-200 flex items-center justify-center mb-2"><span className="text-3xl font-bold text-blue-700">{totalHours}</span></div>
                <div className="font-bold text-blue-800">Horas Totales</div>
                <div className="text-xs text-blue-600 mt-1">Semanales para {filterCourse} "{filterParallel}"</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [theme, setTheme] = useState('light');
  const [viewMode, setViewMode] = useState('daily'); 
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [currentAppUserId, setCurrentAppUserId] = useState(null); 
  const [appUser, setAppUser] = useState(null); 
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [dailyLogs, setDailyLogs] = useState({}); 
  const [isSavingLogs, setIsSavingLogs] = useState(false);
  const [editingPeriodId, setEditingPeriodId] = useState(null);
  const [usersList, setUsersList] = useState([]); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoadingLogin, setIsLoadingLogin] = useState(false);
  const [showUserPanel, setShowUserPanel] = useState(false);
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [showScheduleEditor, setShowScheduleEditor] = useState(false);
  const [showCourseSchedulePanel, setShowCourseSchedulePanel] = useState(false);
  const [showReportsPanel, setShowReportsPanel] = useState(false); 
  const [selectedUserForSchedule, setSelectedUserForSchedule] = useState(null);
  const [academicConfig, setAcademicConfig] = useState(DEFAULT_CONFIG);
  const [userForm, setUserForm] = useState({ id: null, name: '', email: '', password: '', roles: [], workSection: '', assignedSubjects: [] });
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({ day: 'Lunes', timeSlotIndex: 0, course: '', parallel: '', subject: '' });
  const [courseViewFilter, setCourseViewFilter] = useState({ course: '', parallel: '' });
  
  const [toast, setToast] = useState({ message: '', type: '' });
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {}, onCancel: () => {} });

  const showToast = (message, type = 'success') => setToast({ message, type });
  const closeToast = () => setToast({ message: '', type: '' });

  const showConfirm = (title, message, onConfirm) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        await onConfirm();
      },
      onCancel: () => setConfirmDialog(prev => ({ ...prev, isOpen: false }))
    });
  };

  useEffect(() => {
    const init = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) await signInWithCustomToken(auth, __initial_auth_token);
        else await signInAnonymously(auth);
      } catch (e) { console.error(e); }
    };
    init();
    return onAuthStateChanged(auth, setFirebaseUser);
  }, []);

  // Load Config (Robust)
  useEffect(() => {
    if (!firebaseUser) return;
    const configRef = doc(db, 'artifacts', appId, 'public', 'data', 'config', 'academic');
    const unsubscribe = onSnapshot(configRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const templates = data.scheduleTemplates || DEFAULT_CONFIG.scheduleTemplates;
        if (data.timeSlots && (!data.scheduleTemplates || data.scheduleTemplates.length === 0)) {
           templates.push({ id: 'legacy', name: 'Horario Base', slots: data.timeSlots });
        }
        setAcademicConfig({
          sections: data.sections || DEFAULT_CONFIG.sections,
          courses: data.courses || DEFAULT_CONFIG.courses,
          parallels: data.parallels || DEFAULT_CONFIG.parallels,
          subjects: data.subjects || DEFAULT_CONFIG.subjects,
          scheduleTemplates: templates,
          courseSchedules: data.courseSchedules || DEFAULT_CONFIG.courseSchedules
        });
      } else {
        setDoc(configRef, DEFAULT_CONFIG);
      }
    }, (error) => console.error("Config Load Error:", error));
    return () => unsubscribe();
  }, [firebaseUser]);

  useEffect(() => {
    if (academicConfig.courses.length > 0) {
      if (!courseViewFilter.course) setCourseViewFilter({ course: academicConfig.courses[0], parallel: academicConfig.parallels[0] });
      if (!scheduleForm.course) setScheduleForm(prev => ({ ...prev, course: academicConfig.courses[0], parallel: academicConfig.parallels[0], subject: academicConfig.subjects[0] }));
    }
  }, [academicConfig]);

  // Load App User
  useEffect(() => {
    if (!currentAppUserId) return;
    const userRef = doc(db, 'artifacts', appId, 'public', 'data', 'app_users', currentAppUserId);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) setAppUser({ id: docSnap.id, ...docSnap.data() });
    }, (error) => console.error("User Load Error:", error));
    return () => unsubscribe();
  }, [currentAppUserId]);

  // Load Global Users (All users public list)
  useEffect(() => {
    if (!firebaseUser) return;
    const usersRef = collection(db, 'artifacts', appId, 'public', 'data', 'app_users');
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      setUsersList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => console.error("Users List Error:", error));
    return unsubscribe;
  }, [firebaseUser]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoadingLogin(true);
    if (!firebaseUser) { setLoginError("Conectando..."); setIsLoadingLogin(false); return; }
    try {
      // FIX: Filter in memory to avoid index errors on public collection
      const querySnapshot = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'app_users'));
      let foundUser = null;
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        if (userData.email === email && userData.password === password) foundUser = { id: doc.id, ...userData };
      });

      if (!foundUser && email === 'gasencio@ecomundo.edu.ec' && password === '123456') {
        const masterUser = { name: 'Admin Ecomundo', email: 'gasencio@ecomundo.edu.ec', password: '123456', roles: [ROLES.ADMIN, ROLES.TEACHER], workSection: 'Sección Secundaria', assignedSubjects: ['Matemáticas'], createdAt: serverTimestamp(), schedule: [] };
        const docRef = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'app_users'), masterUser);
        foundUser = { id: docRef.id, ...masterUser };
      }
      if (foundUser) {
        setCurrentAppUserId(foundUser.id);
        setIsAuthenticated(true);
      } else {
        setLoginError('Credenciales incorrectas.');
      }
    } catch (err) { console.error(err); setLoginError("Error interno."); } 
    finally { setIsLoadingLogin(false); }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAppUser(null);
    setCurrentAppUserId(null);
    setEmail('');
    setPassword('');
    setShowUserPanel(false); setShowConfigPanel(false); setShowScheduleEditor(false); setShowCourseSchedulePanel(false); setShowReportsPanel(false);
  };

  // Load Logs (PRIVATE collection for this user)
  useEffect(() => {
    if (!currentAppUserId) return;
    // FIX: Using private user subcollection to avoid permissions errors with queries
    const logsRef = collection(db, 'artifacts', appId, 'users', currentAppUserId, 'class_logs');
    const unsubscribe = onSnapshot(logsRef, (snapshot) => {
      const logs = {};
      snapshot.forEach(doc => {
        const data = doc.data();
        logs[`${data.periodId}_${data.date}`] = { id: doc.id, ...data };
      });
      setDailyLogs(logs);
    }, (error) => console.error("Logs Load Error:", error));
    return () => unsubscribe();
  }, [currentAppUserId]);

  const handleSaveLog = async (periodId, dateStr, data) => {
    if (!currentAppUserId) return;
    setIsSavingLogs(true);
    // FIX: Save to private collection
    const logsRef = collection(db, 'artifacts', appId, 'users', currentAppUserId, 'class_logs');
    const logKey = `${periodId}_${dateStr}`;
    try {
      const existingLog = dailyLogs[logKey];
      if (existingLog) {
        await setDoc(doc(logsRef, existingLog.id), { ...existingLog, ...data, lastEdited: serverTimestamp() });
      } else {
        await addDoc(logsRef, { userId: currentAppUserId, date: dateStr, periodId: periodId, ...data, createdAt: serverTimestamp() });
      }
      setEditingPeriodId(null);
      showToast("Planificación guardada");
    } catch (e) { showToast("Error al guardar", 'error'); } 
    finally { setIsSavingLogs(false); }
  };

  // --- Funciones Admin ---
  const handleAddConfigItem = async (type, value) => {
    const updatedList = [...academicConfig[type], value.trim()];
    try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'config', 'academic'), { ...academicConfig, [type]: updatedList }); showToast("Elemento agregado"); } 
    catch (e) { showToast("Error al agregar", 'error'); }
  };

  const handleEditConfigItem = async (type, oldItem, newItem) => {
    const updatedList = academicConfig[type].map(i => i === oldItem ? newItem : i);
    let newConfig = { ...academicConfig, [type]: updatedList };
    if (type === 'courses' && academicConfig.courseSchedules[oldItem]) {
       const newSchedules = { ...academicConfig.courseSchedules };
       newSchedules[newItem] = newSchedules[oldItem];
       delete newSchedules[oldItem];
       newConfig.courseSchedules = newSchedules;
    }
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'config', 'academic'), newConfig);
      showToast("Elemento actualizado");
    } catch(e) { showToast("Error al actualizar", 'error'); }
  };

  const handleDeleteConfigItem = (type, item) => {
    showConfirm("Eliminar Elemento", `¿Estás seguro de eliminar "${item}"?`, async () => {
      const updatedList = academicConfig[type].filter(i => i !== item);
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'config', 'academic'), { ...academicConfig, [type]: updatedList });
      showToast("Elemento eliminado");
    });
  };

  const handleSaveTemplates = async (newTemplates) => {
    try { 
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'config', 'academic'), { ...academicConfig, scheduleTemplates: newTemplates });
      showToast("Plantillas actualizadas");
    } 
    catch (e) { showToast("Error al guardar plantillas", 'error'); }
  };

  const handleDeleteTemplate = (id) => {
    showConfirm("Eliminar Plantilla", "¿Estás seguro de eliminar esta plantilla de horario?", async () => {
      const newTemplates = academicConfig.scheduleTemplates.filter(t => t.id !== id);
      handleSaveTemplates(newTemplates);
    });
  };

  const handleCourseAssignment = async (courseName, templateId) => {
    const newAssignments = { ...academicConfig.courseSchedules, [courseName]: templateId };
    try { 
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'config', 'academic'), { ...academicConfig, courseSchedules: newAssignments });
      showToast("Horario asignado al curso");
    }
    catch (e) { showToast("Error al asignar", 'error'); }
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (userForm.roles.length === 0) return alert("Asigne un rol.");
    if (!userForm.email.endsWith('@ecomundo.edu.ec')) return alert("Use correo institucional.");
    try {
      const usersRef = collection(db, 'artifacts', appId, 'public', 'data', 'app_users');
      if (userForm.id) {
        const userRef = doc(db, 'artifacts', appId, 'public', 'data', 'app_users', userForm.id);
        const { id, ...dataToUpdate } = userForm;
        await updateDoc(userRef, dataToUpdate);
      } else {
        await addDoc(usersRef, { ...userForm, schedule: [], createdAt: serverTimestamp() });
      }
      setUserForm({ id: null, name: '', email: '', password: '', roles: [], workSection: '', assignedSubjects: [] });
      setIsUserFormOpen(false);
      showToast("Usuario guardado");
    } catch (e) { showToast("Error al guardar usuario", 'error'); }
  };

  const handleDeleteUser = async (id) => {
    showConfirm("Eliminar Usuario", "¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.", async () => {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'app_users', id));
      showToast("Usuario eliminado");
    });
  };

  const addScheduleSlot = async () => {
    if (!selectedUserForSchedule) return;
    const currentCourse = scheduleForm.course || academicConfig.courses[0];
    const currentParallel = scheduleForm.parallel || academicConfig.parallels[0];
    const currentSubject = scheduleForm.subject || (selectedUserForSchedule.assignedSubjects?.[0] || academicConfig.subjects[0]);
    if (!currentCourse || !currentParallel || !currentSubject) return alert("Faltan datos.");
    const tmplId = academicConfig.courseSchedules[currentCourse] || academicConfig.scheduleTemplates[0]?.id;
    const template = academicConfig.scheduleTemplates.find(t => t.id === tmplId);
    if (!template) return alert("El curso no tiene plantilla asignada.");
    const slotData = template.slots[scheduleForm.timeSlotIndex];
    if (!slotData) return alert("Hora inválida.");
    const newSlot = { id: crypto.randomUUID(), day: scheduleForm.day, templateId: tmplId, timeSlotId: slotData.id, startTime: slotData.start, endTime: slotData.end, course: currentCourse, parallel: currentParallel, subject: currentSubject };
    const updatedSchedule = [...(selectedUserForSchedule.schedule || []), newSlot];
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'app_users', selectedUserForSchedule.id), { ...selectedUserForSchedule, schedule: updatedSchedule });
      setSelectedUserForSchedule(prev => ({ ...prev, schedule: updatedSchedule }));
      showToast("Hora agregada");
    } catch (e) { showToast("Error guardando", 'error'); }
  };

  const removeScheduleSlot = async (slotId) => {
    if (!selectedUserForSchedule) return;
    showConfirm("Eliminar Clase", "¿Quitar esta hora del horario del docente?", async () => {
      const updatedSchedule = selectedUserForSchedule.schedule.filter(s => s.id !== slotId);
      try {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'app_users', selectedUserForSchedule.id), { ...selectedUserForSchedule, schedule: updatedSchedule });
        setSelectedUserForSchedule(prev => ({ ...prev, schedule: updatedSchedule }));
        showToast("Hora eliminada");
      } catch (e) { showToast("Error eliminando", 'error'); }
    });
  };

  const formatDate = (d) => new Intl.DateTimeFormat('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(d);
  const getWeekDates = (baseDate) => {
    const dates = [];
    const day = baseDate.getDay(); 
    const diff = baseDate.getDate() - day + (day === 0 ? -6 : 1); 
    const monday = new Date(baseDate);
    monday.setDate(diff);
    for (let i = 0; i < 5; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      dates.push(d);
    }
    return dates;
  };
  const stringToColor = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + "00000".substring(0, 6 - c.length) + c;
  };

  // --- Vistas ---
  const renderWeeklyPlanner = () => {
    const weekDates = getWeekDates(currentDate);
    return (
      <div className="overflow-x-auto pb-4">
        <div className="min-w-[1000px] grid grid-cols-5 gap-4">
          {weekDates.map((date, idx) => {
            const dayName = DAYS_OF_WEEK[date.getDay()];
            const dateStr = date.toISOString().split('T')[0];
            const dayClasses = appUser?.schedule?.filter(s => s.day === dayName).sort((a,b) => a.startTime.localeCompare(b.startTime)) || [];
            const isToday = new Date().toISOString().split('T')[0] === dateStr;
            return (
              <div key={idx} className={`flex flex-col gap-3 ${isToday ? 'bg-blue-50/50 rounded-lg -m-2 p-2' : ''}`}>
                <div className={`text-center py-2 rounded-t-lg border-b-2 ${isToday ? 'border-blue-500 text-blue-700 font-bold' : 'border-slate-200 text-slate-600'}`}>
                  <div className="text-sm uppercase">{dayName}</div>
                  <div className="text-2xl font-light">{date.getDate()}</div>
                </div>
                {dayClasses.map(cls => {
                  const logKey = `${cls.id}_${dateStr}`;
                  const log = dailyLogs[logKey] || {};
                  const isEditing = editingPeriodId === logKey;
                  const isCompleted = log.topic && log.topic.trim().length > 0;

                  return (
                    <div key={cls.id} className={`bg-white p-3 rounded shadow-sm border text-xs relative group hover:shadow-md transition-all ${isCompleted ? 'border-l-4 border-l-green-500 border-slate-200 bg-green-50/30' : 'border-slate-200'}`}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-slate-700 bg-slate-100 px-1 rounded">{cls.startTime}</span>
                        {isCompleted && <CheckCircle size={12} className="text-green-500" />}
                      </div>
                      <div className="font-semibold text-slate-800 mb-1 truncate" title={cls.subject}>{cls.subject}</div>
                      <div className="text-[10px] text-slate-500 mb-2">{cls.course} "{cls.parallel}"</div>
                      
                      {isEditing ? (
                         <div className="mt-2 space-y-2">
                           <input id={`topic-${logKey}`} defaultValue={log.topic} placeholder="Tema" className="w-full p-1 border rounded focus:border-blue-500 outline-none" autoFocus />
                           <textarea id={`act-${logKey}`} defaultValue={log.activities} placeholder="Actividades" rows={2} className="w-full p-1 border rounded focus:border-blue-500 outline-none" />
                           <input id={`obs-${logKey}`} defaultValue={log.observations} placeholder="Observaciones" className="w-full p-1 border rounded focus:border-blue-500 outline-none" />
                           <div className="flex justify-end gap-1">
                             <button onClick={() => setEditingPeriodId(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded"><X size={12}/></button>
                             <button onClick={() => handleSaveLog(cls.id, dateStr, { 
                               topic: document.getElementById(`topic-${logKey}`).value,
                               activities: document.getElementById(`act-${logKey}`).value,
                               observations: document.getElementById(`obs-${logKey}`).value
                             })} className="p-1 bg-green-600 text-white rounded hover:bg-green-700"><Save size={12}/></button>
                           </div>
                         </div>
                      ) : (
                        <div onClick={() => setEditingPeriodId(logKey)} className="cursor-pointer min-h-[40px] border-t border-dashed pt-1 mt-1 hover:bg-slate-50 text-slate-500 flex flex-col justify-between">
                          <span className={`truncate ${isCompleted ? 'text-slate-800 font-medium' : 'text-slate-400 italic'}`}>{log.topic || "Planificar..."}</span>
                          {log.observations && <span className="text-[9px] text-yellow-600 truncate bg-yellow-50 px-1 rounded flex items-center gap-1"><Clipboard size={8}/> {log.observations}</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDailySchedule = () => {
    const dayIndex = currentDate.getDay();
    const dayName = DAYS_OF_WEEK[dayIndex];
    const dateStr = currentDate.toISOString().split('T')[0];
    const todayClasses = appUser?.schedule?.filter(s => s.day === dayName).sort((a,b) => a.startTime.localeCompare(b.startTime)) || [];

    if (todayClasses.length === 0) return <div className="text-center py-16 text-slate-400"><Calendar size={48} className="mx-auto mb-4 opacity-20" /><p>Sin clases hoy.</p></div>;

    return (
      <div className="space-y-6">
        {todayClasses.map((cls) => {
          const logKey = `${cls.id}_${dateStr}`;
          const log = dailyLogs[logKey] || {};
          const isEditing = editingPeriodId === logKey;
          const isCompleted = log.topic && log.topic.trim().length > 0;
          
          return (
            <div key={cls.id} className={`bg-white rounded-xl shadow-sm border-l-4 overflow-hidden transition-all ${isEditing ? 'ring-2 ring-green-500 shadow-lg' : 'border-slate-200 hover:shadow-md'} ${isCompleted ? 'border-l-green-500 bg-green-50/20' : ''}`} style={{ borderLeftColor: isCompleted ? '#10b981' : stringToColor(cls.subject) }}>
              <div className="p-4 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="text-center min-w-[80px]">
                    <div className="text-lg font-bold text-slate-700">{cls.startTime}</div>
                    <div className="text-xs text-slate-400">{cls.endTime}</div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      {cls.subject}
                      {isCompleted && <CheckCircle size={18} className="text-green-500 ml-2" />}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                       <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-bold text-sm flex items-center gap-1">
                         <School size={14}/> {cls.course} "{cls.parallel}"
                       </span>
                    </div>
                  </div>
                </div>
                {!isEditing && <button onClick={() => setEditingPeriodId(logKey)} className="p-2 hover:bg-white rounded-full text-slate-400 hover:text-green-600"><Edit size={18} /></button>}
              </div>
              <div className="p-5">
                {isEditing ? (
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    handleSaveLog(cls.id, dateStr, { topic: formData.get('topic'), activities: formData.get('activities'), observations: formData.get('observations') });
                  }} className="space-y-4">
                    <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tema / Objetivo</label><input name="topic" defaultValue={log.topic} className="w-full p-2 border rounded text-sm focus:border-green-500 outline-none" autoFocus /></div>
                    <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Actividades</label><textarea name="activities" defaultValue={log.activities} rows={3} className="w-full p-2 border rounded text-sm focus:border-green-500 outline-none" /></div>
                    <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Observaciones</label><input name="observations" defaultValue={log.observations} className="w-full p-2 border rounded text-sm focus:border-green-500 outline-none" /></div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button type="button" onClick={() => setEditingPeriodId(null)} className="px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100 rounded">Cancelar</button>
                      <button type="submit" disabled={isSavingLogs} className="px-4 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2">{isSavingLogs ? <RotateCcw className="animate-spin" size={14}/> : <Save size={14}/>} Guardar</button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2"><h4 className="text-xs font-bold text-slate-400 uppercase mb-1 flex items-center gap-1"><BookOpen size={12}/> Tema / Actividades</h4>
                      {log.topic || log.activities ? (<div className="text-sm text-slate-700 space-y-1"><p className="font-medium">{log.topic}</p><p className="text-slate-500 whitespace-pre-wrap">{log.activities}</p></div>) : (<p className="text-sm text-slate-300 italic">Sin información registrada.</p>)}
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100"><h4 className="text-xs font-bold text-yellow-600 uppercase mb-1 flex items-center gap-1"><Clipboard size={12}/> Observaciones</h4><p className="text-sm text-slate-600">{log.observations || "-"}</p></div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderCourseSchedule = () => {
    const tmplId = academicConfig.courseSchedules[courseViewFilter.course] || academicConfig.scheduleTemplates[0]?.id;
    const template = academicConfig.scheduleTemplates.find(t => t.id === tmplId);
    if (!template) return <div className="p-8 text-center text-slate-400">No hay plantilla de horario asignada.</div>;
    const sortedSlots = [...template.slots].sort((a,b) => a.start.localeCompare(b.start));
    
    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
             <tr>
               <th className="p-2 border bg-slate-100 text-left text-xs font-bold text-slate-500">Hora ({template.name})</th>
               {DAYS_OF_WEEK.slice(1, 6).map(day => <th key={day} className="p-2 border bg-slate-100 text-center text-xs font-bold text-slate-500">{day}</th>)}
             </tr>
          </thead>
          <tbody>
            {sortedSlots.map((slotData) => (
              <tr key={slotData.id}>
                <td className="p-2 border text-xs font-bold text-slate-600 bg-slate-50"><div className="whitespace-nowrap">{slotData.label}</div><div className="text-[10px] text-slate-400 font-normal">{slotData.start} - {slotData.end}</div></td>
                {DAYS_OF_WEEK.slice(1, 6).map(day => {
                  const match = usersList.find(u => u.schedule?.some(s => s.day === day && (s.timeSlotId === slotData.id || s.startTime === slotData.start) && s.course === courseViewFilter.course && s.parallel === courseViewFilter.parallel));
                  const slot = match?.schedule?.find(s => s.day === day && (s.timeSlotId === slotData.id || s.startTime === slotData.start));
                  return (
                    <td key={day} className="p-2 border text-center min-w-[120px]">
                      {match ? <div className="bg-blue-50 border border-blue-100 rounded p-1 text-xs"><div className="font-bold text-blue-800">{slot.subject}</div><div className="text-[10px] text-slate-500 truncate">{match.name}</div></div> : <span className="text-slate-200 text-xs">-</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const currentCourseTemplateId = academicConfig.courseSchedules[scheduleForm.course] || academicConfig.scheduleTemplates[0]?.id;
  const currentTemplate = academicConfig.scheduleTemplates.find(t => t.id === currentCourseTemplateId);
  const availableSlots = currentTemplate ? currentTemplate.slots.sort((a,b) => a.start.localeCompare(b.start)) : [];

  if (!isAuthenticated) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 font-sans">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
        <h1 className="text-2xl font-serif font-bold text-center mb-6 text-slate-800">Planificador Docente</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" required className="w-full px-4 py-3 rounded-lg border" value={email} onChange={e => setEmail(e.target.value)} placeholder="usuario@ecomundo.edu.ec" />
          <input type="password" required className="w-full px-4 py-3 rounded-lg border" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••" />
          {loginError && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">{loginError}</div>}
          <button type="submit" disabled={isLoadingLogin} className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 rounded-lg">{isLoadingLogin ? '...' : 'Entrar'}</button>
        </form>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <header className="bg-blue-700 text-white shadow-lg sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3"><h1 className="text-xl font-bold tracking-wide flex items-center gap-2"><FileText size={20}/> Planner</h1><span className="text-xs bg-white/20 px-2 py-0.5 rounded-full hidden md:inline-block">{appUser?.name}</span></div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowReportsPanel(true)} className="p-2 hover:bg-white/20 rounded-full" title="Reportes"><BarChart3 size={20}/></button>
            <button onClick={() => setShowCourseSchedulePanel(true)} className="p-2 hover:bg-white/20 rounded-full" title="Horarios por Curso"><Grid size={20}/></button>
            {appUser?.roles?.includes(ROLES.ADMIN) && <><button onClick={() => setShowConfigPanel(true)} className="p-2 hover:bg-white/20 rounded-full"><Settings size={20}/></button><button onClick={() => { setShowUserPanel(true); }} className="p-2 hover:bg-white/20 rounded-full"><Users size={20}/></button></>}
            <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="p-2 hover:bg-white/20 rounded-full">{theme === 'light' ? <Moon size={20}/> : <Sun size={20}/>}</button>
            <button onClick={handleLogout} className="p-2 hover:bg-red-500/80 rounded-full"><LogOut size={20}/></button>
          </div>
        </div>
      </header>

      <div className={`${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} border-b shadow-sm sticky top-[64px] z-10`}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
             <button onClick={() => { setCurrentDate(d => { const n = new Date(d); n.setDate(n.getDate()-7); return n; }); }} className="p-1 hover:bg-slate-100 rounded text-slate-400"><ChevronLeft size={20}/></button>
             <div className="flex items-center gap-2 text-center text-lg font-semibold capitalize"><Calendar size={18} className="text-slate-500"/> {viewMode === 'daily' ? formatDate(currentDate) : `Semana del ${currentDate.getDate()}`}</div>
             <button onClick={() => { setCurrentDate(d => { const n = new Date(d); n.setDate(n.getDate()+7); return n; }); }} className="p-1 hover:bg-slate-100 rounded text-slate-400"><ChevronRight size={20}/></button>
          </div>
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button onClick={() => setViewMode('daily')} className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${viewMode === 'daily' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>Día</button>
            <button onClick={() => setViewMode('weekly')} className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${viewMode === 'weekly' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>Semana</button>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-8">{viewMode === 'daily' ? renderDailySchedule() : renderWeeklyPlanner()}</main>

      {/* --- MODALES --- */}
      
      {showCourseSchedulePanel && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center bg-indigo-50 rounded-t-xl"><h2 className="font-bold text-indigo-800 flex items-center gap-2"><Grid size={18}/> Horario General</h2><button onClick={() => setShowCourseSchedulePanel(false)}><X size={20}/></button></div>
            <div className="p-4 bg-slate-50 border-b flex gap-4">
               <select className="p-2 border rounded" value={courseViewFilter.course} onChange={e => setCourseViewFilter({...courseViewFilter, course: e.target.value})}>{academicConfig.courses.map(c => <option key={c} value={c}>{c}</option>)}</select>
               <select className="p-2 border rounded" value={courseViewFilter.parallel} onChange={e => setCourseViewFilter({...courseViewFilter, parallel: e.target.value})}>{academicConfig.parallels.map(p => <option key={p} value={p}>Paralelo {p}</option>)}</select>
            </div>
            <div className="p-6 overflow-y-auto bg-white">{renderCourseSchedule()}</div>
          </div>
        </div>
      )}

      {showReportsPanel && <ReportsPanel onClose={() => setShowReportsPanel(false)} usersList={usersList} config={academicConfig} />}

      {showUserPanel && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50 rounded-t-xl"><h2 className="font-bold text-slate-700 flex items-center gap-2"><Users size={18}/> Usuarios</h2><button onClick={() => setShowUserPanel(false)}><X size={20}/></button></div>
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
              {!isUserFormOpen && <button onClick={() => { setIsUserFormOpen(true); setUserForm({ id: null, name: '', email: '', password: '', roles: [], workSection: '', assignedSubjects: [] }); }} className="mb-4 flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded text-sm"><Plus size={16}/> Nuevo Usuario</button>}
              {isUserFormOpen && (
                <form onSubmit={handleSaveUser} className="bg-white p-4 rounded border mb-6 grid grid-cols-2 gap-4">
                   <h3 className="col-span-2 font-bold text-sm text-slate-500">{userForm.id ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
                   <input required placeholder="Nombre" className="p-2 border rounded text-sm" value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} />
                   <input required placeholder="Correo Institucional" className="p-2 border rounded text-sm" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} />
                   <input required type="password" placeholder="Contraseña" className="p-2 border rounded text-sm" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} />
                   <select className="p-2 border rounded text-sm" value={userForm.workSection} onChange={e => setUserForm({...userForm, workSection: e.target.value})}><option value="">Sección...</option>{academicConfig.sections.map(s => <option key={s} value={s}>{s}</option>)}</select>
                   <div className="col-span-2"><label className="block text-xs font-bold text-slate-400 mb-1">Materias</label><div className="flex flex-wrap gap-2 bg-slate-50 p-2 rounded border">{academicConfig.subjects.map(sub => <div key={sub} onClick={() => setUserForm(p => ({...p, assignedSubjects: p.assignedSubjects.includes(sub) ? p.assignedSubjects.filter(x => x!==sub) : [...p.assignedSubjects, sub]}))} className={`cursor-pointer px-2 py-1 text-xs border rounded transition-all ${userForm.assignedSubjects.includes(sub) ? 'bg-blue-100 border-blue-500 text-blue-700 font-bold' : 'bg-white hover:bg-slate-100'}`}>{sub}</div>)}</div></div>
                   <div className="col-span-2 flex gap-2">{Object.values(ROLES).map(r => <div key={r} onClick={() => setUserForm(p => ({...p, roles: p.roles.includes(r) ? p.roles.filter(x => x!==r) : [...p.roles, r]}))} className={`cursor-pointer px-2 py-1 border rounded text-xs ${userForm.roles.includes(r) ? 'bg-green-100 border-green-500' : ''}`}>{r}</div>)}</div>
                   <div className="col-span-2 flex justify-end gap-2"><button type="button" onClick={() => setIsUserFormOpen(false)} className="text-sm text-slate-500 hover:bg-slate-100 px-3 py-1 rounded">Cancelar</button><button type="submit" className="text-sm bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700 font-medium">Guardar</button></div>
                </form>
              )}
              <div className="bg-white rounded border overflow-hidden">
                <table className="w-full text-sm text-left"><thead className="bg-slate-100"><tr><th className="p-3">Usuario</th><th className="p-3">Materias</th><th className="p-3 text-right">Acciones</th></tr></thead><tbody>{usersList.map(u => (<tr key={u.id} className="border-t hover:bg-slate-50"><td className="p-3"><div>{u.name}</div><div className="text-xs text-slate-400">{u.email}</div></td><td className="p-3 text-xs text-slate-500">{u.assignedSubjects?.join(', ') || '-'}</td><td className="p-3 text-right flex justify-end gap-2"><button onClick={() => { setUserForm({ id: u.id, name: u.name, email: u.email, password: u.password, roles: u.roles||[], workSection: u.workSection||'', assignedSubjects: u.assignedSubjects||[] }); setIsUserFormOpen(true); }} className="p-1.5 bg-yellow-50 text-yellow-600 rounded" title="Editar"><Edit size={16}/></button><button onClick={() => { setSelectedUserForSchedule(u); setShowScheduleEditor(true); }} className="p-1.5 bg-blue-50 text-blue-600 rounded" title="Horario"><Calendar size={16}/></button>{u.email !== 'gasencio@ecomundo.edu.ec' && <button onClick={() => handleDeleteUser(u.id)} className="p-1.5 bg-red-50 text-red-600 rounded"><Trash2 size={16}/></button>}</td></tr>))}</tbody></table>
              </div>
            </div>
          </div>
        </div>
      )}

      {showConfigPanel && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50 rounded-t-xl"><h2 className="font-bold text-slate-700 flex items-center gap-2"><Settings size={18}/> Configuración Académica</h2><button onClick={() => setShowConfigPanel(false)}><X size={20}/></button></div>
            <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <ConfigList title="Secciones" type="sections" items={academicConfig.sections} onAdd={handleAddConfigItem} onDelete={handleDeleteConfigItem} onEdit={handleEditConfigItem} />
              <ConfigList title="Materias" type="subjects" items={academicConfig.subjects} onAdd={handleAddConfigItem} onDelete={handleDeleteConfigItem} onEdit={handleEditConfigItem} />
              <ConfigList title="Cursos" type="courses" items={academicConfig.courses} onAdd={handleAddConfigItem} onDelete={handleDeleteConfigItem} onEdit={handleEditConfigItem} />
              <ConfigList title="Paralelos" type="parallels" items={academicConfig.parallels} onAdd={handleAddConfigItem} onDelete={handleDeleteConfigItem} onEdit={handleEditConfigItem} />
              <ScheduleTemplateManager templates={academicConfig.scheduleTemplates || []} onSaveTemplates={handleSaveTemplates} onDeleteTemplate={handleDeleteTemplate} />
              <CourseScheduleMapper courses={academicConfig.courses} templates={academicConfig.scheduleTemplates || []} assignments={academicConfig.courseSchedules} onSaveAssignment={handleCourseAssignment} />
            </div>
          </div>
        </div>
      )}

      {showScheduleEditor && selectedUserForSchedule && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center bg-blue-50 rounded-t-xl"><div><h2 className="font-bold text-blue-800 flex items-center gap-2"><Clock size={18}/> Horario: {selectedUserForSchedule.name}</h2></div><button onClick={() => setShowScheduleEditor(false)}><X size={20}/></button></div>
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
              <div className="bg-white p-4 rounded border mb-6 flex flex-wrap gap-3 items-end shadow-sm">
                <div className="w-32"><label className="block text-xs font-bold text-slate-400 mb-1">Curso</label><select className="w-full p-2 border rounded text-sm" value={scheduleForm.course} onChange={e => setScheduleForm({...scheduleForm, course: e.target.value})}>{academicConfig.courses.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                <div className="w-16"><label className="block text-xs font-bold text-slate-400 mb-1">Par.</label><select className="w-full p-2 border rounded text-sm" value={scheduleForm.parallel} onChange={e => setScheduleForm({...scheduleForm, parallel: e.target.value})}>{academicConfig.parallels.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
                <div className="flex-1 min-w-[120px]"><label className="block text-xs font-bold text-slate-400 mb-1">Día</label><select className="w-full p-2 border rounded text-sm" value={scheduleForm.day} onChange={e => setScheduleForm({...scheduleForm, day: e.target.value})}>{DAYS_OF_WEEK.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                <div className="flex-1 min-w-[150px]"><label className="block text-xs font-bold text-slate-400 mb-1">Hora ({currentTemplate?.name || '?'})</label><select className="w-full p-2 border rounded text-sm" value={scheduleForm.timeSlotIndex} onChange={e => setScheduleForm({...scheduleForm, timeSlotIndex: parseInt(e.target.value)})}>{availableSlots.map((slot, idx) => (<option key={idx} value={idx}>{slot.label} ({slot.start} - {slot.end})</option>))}</select></div>
                <div className="flex-1 min-w-[120px]"><label className="block text-xs font-bold text-slate-400 mb-1">Materia</label><select className="w-full p-2 border rounded text-sm" value={scheduleForm.subject} onChange={e => setScheduleForm({...scheduleForm, subject: e.target.value})}><option value="">Seleccionar...</option>{(selectedUserForSchedule.assignedSubjects?.length > 0 ? selectedUserForSchedule.assignedSubjects : academicConfig.subjects).map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                <button onClick={addScheduleSlot} className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 h-10 w-10 flex items-center justify-center"><Plus size={20}/></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">{DAYS_OF_WEEK.slice(1, 6).map(day => (<div key={day} className="bg-white rounded border overflow-hidden flex flex-col"><div className="bg-slate-100 p-2 font-bold text-center text-sm border-b">{day}</div><div className="p-2 space-y-2 flex-1 min-h-[100px]">{selectedUserForSchedule.schedule?.filter(s => s.day === day).sort((a,b) => a.startTime.localeCompare(b.startTime)).map(slot => (<div key={slot.id} className="bg-blue-50 border border-blue-100 p-2 rounded text-xs relative group hover:shadow-md transition-all"><div className="font-bold text-blue-800">{slot.startTime} - {slot.endTime}</div><div className="font-medium truncate" title={slot.subject}>{slot.subject}</div><div className="text-slate-500">{slot.course} "{slot.parallel}"</div><button onClick={() => removeScheduleSlot(slot.id)} className="absolute top-1 right-1 text-red-400 hover:text-red-600"><MinusCircle size={14}/></button></div>))}</div></div>))}</div>
            </div>
            <div className="p-4 border-t bg-white flex justify-end"><button onClick={() => setShowScheduleEditor(false)} className="px-4 py-2 bg-slate-800 text-white rounded">Cerrar</button></div>
          </div>
        </div>
      )}

      {/* Notificación y Modal Global */}
      <Toast message={toast.message} type={toast.type} onClose={closeToast} />
      <ConfirmModal isOpen={confirmDialog.isOpen} title={confirmDialog.title} message={confirmDialog.message} onConfirm={confirmDialog.onConfirm} onCancel={confirmDialog.onCancel} />
    </div>
  );
};

export default App;