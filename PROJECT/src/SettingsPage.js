import React from 'react';
import { Trash2, Download, Upload, Moon, Sun } from 'lucide-react';
import { useExpenses } from '../context/ExpenseContext';
import { useTheme } from '../context/ThemeContext';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';

const SettingsPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { expenses, categories, budgets } = useExpenses();
  
  const handleExport = () => {
    const data = {
      expenses,
      categories,
      budgets,
      exportDate: new Date().toISOString(),
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const exportFileDefaultName = `expense-tracker-data-${new Date().toISOString().slice(0, 10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };
  
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          
          if (!data.expenses || !data.categories || !data.budgets) {
            alert('Invalid data format. The file should contain expenses, categories, and budgets.');
            return;
          }
          
          localStorage.setItem('expenses', JSON.stringify(data.expenses));
          localStorage.setItem('categories', JSON.stringify(data.categories));
          localStorage.setItem('budgets', JSON.stringify(data.budgets));
          
          alert('Data imported successfully. The page will reload to apply changes.');
          window.location.reload();
        } catch (error) {
          console.error('Error parsing the imported file:', error);
          alert('Error importing data. Please check the file format.');
        }
      };
      
      reader.readAsText(file);
    };
    
    input.click();
  };
  
  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all data? This action cannot be undone.')) {
      localStorage.removeItem('expenses');
      localStorage.removeItem('categories');
      localStorage.removeItem('budgets');
      
      alert('All data has been reset. The page will reload.');
      window.location.reload();
    }
  };
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Settings</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Theme</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Switch between light and dark mode
              </p>
            </div>
            <Button
              variant="outline"
              onClick={toggleTheme}
              icon={theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            >
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Export Data</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Download your expense data as a JSON file
              </p>
            </div>
            <Button 
              variant="outline"
              onClick={handleExport}
              icon={<Download size={16} />}
            >
              Export
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Import Data</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Import expense data from a JSON file
              </p>
            </div>
            <Button 
              variant="outline"
              onClick={handleImport}
              icon={<Upload size={16} />}
            >
              Import
            </Button>
          </div>
        </CardContent>
        <CardFooter className="border-t border-gray-200 dark:border-gray-700">
          <div className="w-full flex items-center justify-between">
            <div>
              <h3 className="font-medium text-red-500 dark:text-red-400">Reset Data</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Delete all your expense data
              </p>
            </div>
            <Button 
              variant="danger"
              onClick={handleReset}
              icon={<Trash2 size={16} />}
            >
              Reset
            </Button>
          </div>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 dark:text-gray-300">
            ExpenseTracker is a simple app to help you track your expenses and manage your budget.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Version 1.0.0
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;