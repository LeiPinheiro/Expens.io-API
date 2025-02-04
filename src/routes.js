import { Router } from "express";
import { userRegister, userLogin } from './controllers/Login&RegisterController'
import { creatingExpense, updateUserExpense, deletingExpense, getExpenses, totalSpent } from './controllers/UserExpensesController'
import { updateData } from './controllers/UserSettingsController'
import { authMiddleware } from "./middlewares/authMiddleware";

const routes = Router()

// Login and register section
routes.post('/api/register', userRegister)
routes.post('/api/login', userLogin)

// User expenses section
routes.post('/api/expenses', authMiddleware, creatingExpense)
routes.put('/api/expenses/:id', authMiddleware, updateUserExpense)
routes.delete('/api/expenses/:id', authMiddleware, deletingExpense)
routes.get('/api/expenses', authMiddleware, getExpenses)
routes.get('/api/expenses/total', authMiddleware, totalSpent)

// User data update section
routes.put('/api/expenses/update/:id', authMiddleware, updateData)
