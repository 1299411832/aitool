import { useState, useMemo, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom'
import { defaultTools } from './store/data'

// 鉴权
const useAuth = () => {
  const isLogin = !!localStorage.getItem('adminToken')
  return { isLogin }
}

// 路由守卫
const RequireAuth = ({ children }) => {
  const { isLogin } = useAuth()
  if (!isLogin) return <Navigate to="/login" replace />
  return children
}

// 持久化工具数据
function useToolsData() {
  const [tools, setTools] = useState([])

  useEffect(() => {
    const local = localStorage.getItem('customTools')
    if (local) {
      const custom = JSON.parse(local)
      setTools([...defaultTools, ...custom])
    } else {
      setTools(defaultTools)
    }
  }, [])

  const saveCustom = (list) => {
    const customOnly = list.filter(item => !defaultTools.find(d => d.id === item.id))
    localStorage.setItem('customTools', JSON.stringify(customOnly))
    setTools(list)
  }

  return { tools, setTools: saveCustom }
}

// 全局提示组件
function Toast({ msg, show }) {
  if (!show) return null
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-black/80 text-white px-6 py-3 rounded-lg fade-in">
      {msg}
    </div>
  )
}

// 主题切换
function useTheme() {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')
  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme','dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme','light')
    }
  }, [dark])
  return [dark, setDark]
}

// 前台首页
function HomePage() {
  const [searchText, setSearchText] = useState('')
  const [activeCategory, setActiveCategory] = useState('全部')
  const { isLogin } = useAuth()
  const { tools } = useToolsData()
  const [dark, setDark] = useTheme()

  const categories = useMemo(() => {
    const catSet = new Set(tools.map(item => item.category))
    return ['全部', ...Array.from(catSet)]
  }, [tools])

  const filteredList = useMemo(() => {
    return tools.filter(item => {
      const s = searchText.toLowerCase()
      return (item.name.toLowerCase().includes(s) || item.desc.toLowerCase().includes(s))
      && (activeCategory === '全部' || item.category === activeCategory)
    })
  }, [tools, searchText, activeCategory])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <header className="bg-white dark:bg-slate-800 shadow py-4 px-4 transition-colors duration-300">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">AI工具导航站</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">精选AI工具合集 · 共{tools.length}款</p>
          </div>
          <div className="flex gap-3 items-center">
            <button onClick={()=>setDark(!dark)} className="px-3 py-2 rounded-lg border dark:border-slate-600 dark:text-white">
              {dark ? '☀️ 亮色' : '🌙 暗色'}
            </button>
            {isLogin && (
              <Link to="/admin" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                后台管理
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4">
        <input
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="搜索AI工具名称 / 描述..."
          className="w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg px-4 py-3 mb-6 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
        />

        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-sm transition ${
                activeCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-slate-800 dark:text-white border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredList.map(tool => (
            <a
              key={tool.id}
              href={tool.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white dark:bg-slate-800 rounded-xl shadow overflow-hidden group hover:shadow-lg transition fade-in"
            >
              <img src={tool.cover} alt={tool.name} className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="p-4">
                <span className="inline-block text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                  {tool.category}
                </span>
                <h3 className="text-lg font-semibold mt-2 text-slate-800 dark:text-white">{tool.name}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{tool.desc}</p>
              </div>
            </a>
          ))}
        </div>

        {filteredList.length === 0 && (
          <div className="text-center py-20 text-slate-400">暂无匹配工具</div>
        )}
      </main>
    </div>
  )
}

// 登录页
function LoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [errMsg, setErrMsg] = useState('')

  const handleSubmit = () => {
    const adminUser = "admin"
    const adminPwd = "admin123456"
    if (form.username === adminUser && form.password === adminPwd) {
      localStorage.setItem('adminToken', 'ai-tool-nav-admin')
      navigate('/admin')
    } else {
      setErrMsg('账号或密码错误')
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow w-96 fade-in">
        <h2 className="text-2xl font-bold mb-6 dark:text-white">管理员登录</h2>
        {errMsg && <p className="text-red-500 mb-4">{errMsg}</p>}
        <input
          className="w-full border p-3 rounded mb-4 dark:bg-slate-700 dark:text-white dark:border-slate-600"
          placeholder="账号"
          value={form.username}
          onChange={e => setForm({...form, username: e.target.value})}
        />
        <input
          type="password"
          className="w-full border p-3 rounded mb-4 dark:bg-slate-700 dark:text-white dark:border-slate-600"
          placeholder="密码"
          value={form.password}
          onChange={e => setForm({...form, password: e.target.value})}
        />
        <button onClick={handleSubmit} className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 transition">登录</button>
        <Link to="/" className="block text-center mt-4 text-blue-600">返回首页</Link>
      </div>
    </div>
  )
}

// 后台管理（完整版CRUD）
function AdminPage() {
  const navigate = useNavigate()
  const { tools, setTools } = useToolsData()
  const [form, setForm] = useState({ name:'', category:'', desc:'', url:'', cover:'' })
  const [editId, setEditId] = useState(null)
  const [toast, setToast] = useState({ show:false, msg:'' })
  const [delConfirm, setDelConfirm] = useState(null)

  const showToast = (msg) => {
    setToast({ show:true, msg })
    setTimeout(()=>setToast({show:false,msg:''}),2000)
  }

  const resetForm = () => {
    setForm({ name:'', category:'', desc:'', url:'', cover:'' })
    setEditId(null)
  }

  const submit = () => {
    if(!form.name || !form.category || !form.desc || !form.url){
      showToast('请填写完整必填信息')
      return
    }

    if(editId){
      const res = tools.map(item => item.id === editId ? {...item,...form} : item)
      setTools(res)
      showToast('修改成功！')
    }else{
      const newItem = { ...form, id: Date.now(), cover: form.cover || "https://picsum.photos/300/200" }
      setTools([...tools, newItem])
      showToast('新增工具成功！')
    }
    resetForm()
  }

  const del = (id) => {
    const res = tools.filter(item => item.id !== id)
    setTools(res)
    setDelConfirm(null)
    showToast('删除成功')
  }

  const startEdit = (item) => {
    setForm(item)
    setEditId(item.id)
    window.scrollTo(0,0)
  }

  const logout = () => {
    localStorage.removeItem('adminToken')
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8 transition-colors duration-300">
      <Toast show={toast.show} msg={toast.msg} />

      <div className="max-w-7xl mx-auto flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold dark:text-white">后台管理中心</h1>
        <div className="flex gap-3">
          <Link to="/" className="px-4 py-2 border rounded-lg dark:text-white dark:border-slate-600">返回前台</Link>
          <button onClick={logout} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">退出登录</button>
        </div>
      </div>

      {/* 数据统计 */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow">
          <p className="text-slate-500 dark:text-slate-400">工具总数</p>
          <p className="text-2xl font-bold dark:text-white">{tools.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow">
          <p className="text-slate-500 dark:text-slate-400">分类数量</p>
          <p className="text-2xl font-bold dark:text-white">{new Set(tools.map(i=>i.category)).size}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow">
          <p className="text-slate-500 dark:text-slate-400">可自定义新增</p>
          <p className="text-2xl font-bold text-green-500">无限制</p>
        </div>
      </div>

      {/* 新增/编辑表单 */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow mb-8 fade-in">
        <h2 className="text-xl font-bold mb-4 dark:text-white">{editId ? '编辑工具' : '新增工具'}</h2>
        <div className="grid grid-cols-2 gap-4">
          <input placeholder="工具名称" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="border p-3 rounded dark:bg-slate-700 dark:text-white dark:border-slate-600"/>
          <input placeholder="分类（例：AI绘画）" value={form.category} onChange={e=>setForm({...form,category:e.target.value})} className="border p-3 rounded dark:bg-slate-700 dark:text-white dark:border-slate-600"/>
          <input placeholder="官网链接" value={form.url} onChange={e=>setForm({...form,url:e.target.value})} className="border p-3 rounded col-span-2 dark:bg-slate-700 dark:text-white dark:border-slate-600"/>
          <textarea placeholder="工具描述" value={form.desc} onChange={e=>setForm({...form,desc:e.target.value})} className="border p-3 rounded col-span-2 dark:bg-slate-700 dark:text-white dark:border-slate-600"/>
          <input placeholder="封面图链接（选填）" value={form.cover} onChange={e=>setForm({...form,cover:e.target.value})} className="border p-3 rounded col-span-2 dark:bg-slate-700 dark:text-white dark:border-slate-600"/>
        </div>
        <div className="flex gap-3 mt-4">
          <button onClick={submit} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">{editId ? '保存修改' : '提交新增'}</button>
          {editId && <button onClick={resetForm} className="px-6 py-2 border rounded-lg dark:text-white">取消编辑</button>}
        </div>
      </div>

      {/* 工具列表 */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow">
        <h2 className="text-xl font-bold mb-4 dark:text-white">工具列表管理</h2>
        <div className="space-y-3">
          {tools.map(item => (
            <div key={item.id} className="border dark:border-slate-700 p-4 rounded-lg flex justify-between items-center fade-in">
              <div>
                <h3 className="font-bold dark:text-white">{item.name}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{item.category}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={()=>startEdit(item)} className="px-3 py-1 bg-green-500 text-white rounded">编辑</button>
                <button onClick={()=>setDelConfirm(item.id)} className="px-3 py-1 bg-red-500 text-white rounded">删除</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 删除确认弹窗 */}
      {delConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl fade-in">
            <p className="mb-4 dark:text-white">确定删除该工具？此操作不可恢复</p>
            <div className="flex gap-3">
              <button onClick={()=>del(delConfirm)} className="px-4 py-2 bg-red-500 text-white rounded">确认删除</button>
              <button onClick={()=>setDelConfirm(null)} className="px-4 py-2 border rounded dark:text-white">取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 路由总入口
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin" element={<RequireAuth><AdminPage /></RequireAuth>} />
      </Routes>
    </Router>
  )
}
