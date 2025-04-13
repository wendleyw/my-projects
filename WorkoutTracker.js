import React, { useState, useEffect } from 'react';

const WorkoutTracker = () => {
  const [workouts, setWorkouts] = useState([]);
  const [selectedDay, setSelectedDay] = useState('');
  const [loading, setLoading] = useState(true);
  const [completedExercises, setCompletedExercises] = useState({});
  const [notes, setNotes] = useState({});
  const [history, setHistory] = useState({});
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [newExercise, setNewExercise] = useState({
    muscleGroup: '',
    exercise: '',
    setsReps: '',
    searchUrl: ''
  });
  const [showHistory, setShowHistory] = useState(false);
  const [historyDate, setHistoryDate] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        // Modificado para usar fetch em vez de window.fs.readFile
        const response = await fetch('/workouts.tsv');
        const data = await response.text();
        const parsedWorkouts = parseWorkoutData(data);
        setWorkouts(parsedWorkouts);
        
        // Set current day as default
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const today = days[new Date().getDay()];
        setSelectedDay(today);
        
        // Try to load saved progress from localStorage
        const savedProgress = localStorage.getItem('workoutProgress');
        if (savedProgress) {
          setCompletedExercises(JSON.parse(savedProgress));
        }
        
        const savedNotes = localStorage.getItem('workoutNotes');
        if (savedNotes) {
          setNotes(JSON.parse(savedNotes));
        }
        
        const savedHistory = localStorage.getItem('workoutHistory');
        if (savedHistory) {
          setHistory(JSON.parse(savedHistory));
        }
        
        // Set today's date as default for history view
        const dateStr = new Date().toISOString().split('T')[0];
        setHistoryDate(dateStr);
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading workout data:', error);
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Parse the TSV workout data
  const parseWorkoutData = (data) => {
    const lines = data.split('\n');
    const result = {};
    
    lines.forEach(line => {
      if (!line.trim() || line.startsWith('Dia da Semana')) return;
      
      const fields = line.split('\t');
      if (fields.length < 4) return;
      
      const [day, muscleGroup, exercise, setsReps, searchUrl] = fields;
      
      if (!result[day]) {
        result[day] = {};
      }
      
      if (!result[day][muscleGroup]) {
        result[day][muscleGroup] = [];
      }
      
      result[day][muscleGroup].push({
        exercise,
        setsReps,
        searchUrl: searchUrl || `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(exercise + ' exercise')}`
      });
    });
    
    return result;
  };
  
  const toggleExerciseCompletion = (day, muscleGroup, exercise) => {
    const key = `${day}-${muscleGroup}-${exercise}`;
    const dateKey = new Date().toISOString().split('T')[0];
    const isCompleted = !completedExercises[key];
    
    // Update current progress
    const newCompletedExercises = {
      ...completedExercises,
      [key]: isCompleted
    };
    
    setCompletedExercises(newCompletedExercises);
    localStorage.setItem('workoutProgress', JSON.stringify(newCompletedExercises));
    
    // Save to history
    const newHistory = { ...history };
    if (!newHistory[dateKey]) {
      newHistory[dateKey] = { exercises: {}, notes: {} };
    }
    
    newHistory[dateKey].exercises[key] = isCompleted;
    
    // Also save the current note to history
    if (notes[key]) {
      newHistory[dateKey].notes[key] = notes[key];
    }
    
    setHistory(newHistory);
    localStorage.setItem('workoutHistory', JSON.stringify(newHistory));
  };
  
  const handleNoteChange = (day, muscleGroup, exercise, note) => {
    const key = `${day}-${muscleGroup}-${exercise}`;
    const dateKey = new Date().toISOString().split('T')[0];
    
    // Update current notes
    const newNotes = {
      ...notes,
      [key]: note
    };
    
    setNotes(newNotes);
    localStorage.setItem('workoutNotes', JSON.stringify(newNotes));
    
    // Update history notes
    const newHistory = { ...history };
    if (!newHistory[dateKey]) {
      newHistory[dateKey] = { exercises: {}, notes: {} };
    }
    
    newHistory[dateKey].notes[key] = note;
    setHistory(newHistory);
    localStorage.setItem('workoutHistory', JSON.stringify(newHistory));
  };
  
  const resetDayProgress = () => {
    if (!selectedDay) return;
    
    const newCompletedExercises = { ...completedExercises };
    const newNotes = { ...notes };
    
    // Find all keys for selected day and reset them
    Object.keys(newCompletedExercises).forEach(key => {
      if (key.startsWith(selectedDay)) {
        delete newCompletedExercises[key];
      }
    });
    
    Object.keys(newNotes).forEach(key => {
      if (key.startsWith(selectedDay)) {
        delete newNotes[key];
      }
    });
    
    setCompletedExercises(newCompletedExercises);
    setNotes(newNotes);
    localStorage.setItem('workoutProgress', JSON.stringify(newCompletedExercises));
    localStorage.setItem('workoutNotes', JSON.stringify(newNotes));
  };
  
  const addExercise = () => {
    if (!selectedDay || !newExercise.exercise || !newExercise.muscleGroup || !newExercise.setsReps) return;
    
    const updatedWorkouts = { ...workouts };
    
    // Create muscle group if it doesn't exist
    if (!updatedWorkouts[selectedDay]) {
      updatedWorkouts[selectedDay] = {};
    }
    
    if (!updatedWorkouts[selectedDay][newExercise.muscleGroup]) {
      updatedWorkouts[selectedDay][newExercise.muscleGroup] = [];
    }
    
    // Add the new exercise
    updatedWorkouts[selectedDay][newExercise.muscleGroup].push({
      exercise: newExercise.exercise,
      setsReps: newExercise.setsReps,
      searchUrl: newExercise.searchUrl || `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(newExercise.exercise + ' exercise')}`
    });
    
    // Update state and save in localStorage
    setWorkouts(updatedWorkouts);
    localStorage.setItem('workoutPlan', JSON.stringify(updatedWorkouts));
    
    // Reset form
    setNewExercise({
      muscleGroup: '',
      exercise: '',
      setsReps: '',
      searchUrl: ''
    });
    
    setShowAddExercise(false);
  };
  
  const handleHistoryDateChange = (e) => {
    setHistoryDate(e.target.value);
  };
  
  if (loading) {
    return <div className="p-4 text-center">Carregando seu plano de treino...</div>;
  }
  
  // Calculate completion stats for the selected day
  const getCompletionStats = () => {
    if (!selectedDay || !workouts[selectedDay]) return { total: 0, completed: 0, percentage: 0 };
    
    let total = 0;
    let completed = 0;
    
    Object.keys(workouts[selectedDay]).forEach(muscleGroup => {
      workouts[selectedDay][muscleGroup].forEach(ex => {
        total++;
        const key = `${selectedDay}-${muscleGroup}-${ex.exercise}`;
        if (completedExercises[key]) {
          completed++;
        }
      });
    });
    
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { total, completed, percentage };
  };
  
  const stats = getCompletionStats();

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-center">Acompanhamento de Treino</h1>
      
      <div className="flex justify-end mb-4 gap-2">
        <button 
          onClick={() => setShowHistory(!showHistory)}
          className="px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          {showHistory ? 'Voltar ao Treino' : 'Ver Histórico'}
        </button>
        
        {!showHistory && (
          <button 
            onClick={() => setShowAddExercise(!showAddExercise)}
            className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            {showAddExercise ? 'Cancelar' : 'Adicionar Exercício'}
          </button>
        )}
      </div>
      
      {showHistory ? (
        <div className="mb-6 bg-gray-50 p-4 rounded-lg border">
          <h2 className="text-xl font-bold mb-4">Histórico de Treinos</h2>
          
          <div className="mb-4">
            <label className="block mb-2 font-medium">Selecione a Data:</label>
            <input 
              type="date" 
              value={historyDate}
              onChange={handleHistoryDateChange}
              className="px-3 py-2 border rounded"
            />
          </div>
          
          {history[historyDate] ? (
            <div>
              <h3 className="font-medium mb-2">Atividades em {new Date(historyDate).toLocaleDateString()}</h3>
              <div className="space-y-2">
                {Object.keys(history[historyDate].exercises).map(key => {
                  const [day, muscleGroup, exercise] = key.split('-');
                  const completed = history[historyDate].exercises[key];
                  const note = history[historyDate].notes[key] || '';
                  
                  return (
                    <div key={key} className={`p-2 rounded border ${completed ? 'bg-green-50' : 'bg-red-50'}`}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${completed ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="font-medium">{day}: {exercise}</span>
                        <span className="text-sm text-gray-500">({muscleGroup})</span>
                      </div>
                      {note && (
                        <div className="mt-1 text-sm text-gray-700 pl-5">
                          Nota: {note}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p>Nenhum registro encontrado para esta data.</p>
          )}
        </div>
      ) : (
        <>
          {showAddExercise && (
            <div className="mb-6 bg-gray-50 p-4 rounded-lg border">
              <h3 className="text-lg font-medium mb-3">Adicionar Novo Exercício</h3>
              <div className="space-y-3">
                <div>
                  <label className="block mb-1 text-sm font-medium">Grupo Muscular:</label>
                  <input 
                    type="text" 
                    value={newExercise.muscleGroup}
                    onChange={(e) => setNewExercise({...newExercise, muscleGroup: e.target.value})}
                    placeholder="Ex: Chest, Back, Legs, etc."
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Nome do Exercício:</label>
                  <input 
                    type="text" 
                    value={newExercise.exercise}
                    onChange={(e) => setNewExercise({...newExercise, exercise: e.target.value})}
                    placeholder="Ex: Bench Press, Squat, etc."
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Séries x Repetições:</label>
                  <input 
                    type="text" 
                    value={newExercise.setsReps}
                    onChange={(e) => setNewExercise({...newExercise, setsReps: e.target.value})}
                    placeholder="Ex: 3 x 8-12"
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">URL de Busca (opcional):</label>
                  <input 
                    type="text" 
                    value={newExercise.searchUrl}
                    onChange={(e) => setNewExercise({...newExercise, searchUrl: e.target.value})}
                    placeholder="Link para busca do exercício"
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div className="pt-2">
                  <button 
                    onClick={addExercise}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Adicionar Exercício
                  </button>
                </div>
              </div>
            </div>
          )}
        
          <div className="mb-6">
            <label className="block mb-2 font-medium">Selecione o Dia:</label>
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.keys(workouts).map(day => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`px-3 py-2 rounded ${selectedDay === day 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300'}`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
      
      {selectedDay && workouts[selectedDay] ? (
        <>
          <div className="mb-6 p-4 bg-gray-100 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-bold">{selectedDay}</h2>
              <div className="text-sm">
                <span className="font-medium">{stats.completed}/{stats.total} exercícios</span>
                <div className="w-full bg-gray-300 h-2 rounded-full mt-1">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${stats.percentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <button 
              onClick={resetDayProgress}
              className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
            >
              Reiniciar Dia
            </button>
          </div>
          
          {Object.keys(workouts[selectedDay]).map(muscleGroup => (
            <div key={muscleGroup} className="mb-6">
              <h3 className="text-lg font-semibold mb-2 bg-gray-200 p-2 rounded">
                {muscleGroup}
              </h3>
              <div className="space-y-3">
                {workouts[selectedDay][muscleGroup].map((exercise, index) => {
                  const key = `${selectedDay}-${muscleGroup}-${exercise.exercise}`;
                  const isCompleted = completedExercises[key] || false;
                  
                  return (
                    <div 
                      key={index} 
                      className={`p-3 border rounded ${isCompleted ? 'bg-green-50 border-green-200' : 'bg-white'}`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isCompleted}
                          onChange={() => toggleExerciseCompletion(selectedDay, muscleGroup, exercise.exercise)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <span className={`font-medium ${isCompleted ? 'line-through text-gray-500' : ''}`}>
                              {exercise.exercise}
                            </span>
                            <span className="text-sm text-gray-600 font-medium">
                              {exercise.setsReps}
                            </span>
                          </div>
                          <input
                            type="text"
                            placeholder="Adicionar anotações (peso, sensações, etc.)"
                            value={notes[key] || ''}
                            onChange={(e) => handleNoteChange(selectedDay, muscleGroup, exercise.exercise, e.target.value)}
                            className="w-full mt-2 p-1 text-sm border rounded"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </>
      ) : (
        <div className="text-center p-4 bg-gray-100 rounded">
          {selectedDay === 'Thursday' ? 
            'Dia de descanso! Aproveite para recuperar.' : 
            'Selecione um dia para ver seu treino.'}
        </div>
      )}
    </div>
  );
};

export default WorkoutTracker;
