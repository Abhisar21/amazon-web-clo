import React, { useEffect, useState } from 'react'

const API = (path) => '/api' + path;

function App(){
  const [products, setProducts] = useState([]);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cart, setCart] = useState([]);

  useEffect(()=>{ fetchProducts(); if(token) fetchCart(); }, [token]);

  async function fetchProducts(){
    const res = await fetch(API('/products'));
    setProducts(await res.json());
  }
  async function fetchCart(){
    const res = await fetch(API('/cart'), { headers: { Authorization: 'Bearer ' + token } });
    if (res.status === 401) { setCart([]); return; }
    setCart(await res.json());
  }

  async function register(){
    const res = await fetch(API('/auth/register'), {
      method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if(data.token){ localStorage.setItem('token', data.token); setToken(data.token); alert('Registered and logged in'); fetchCart(); }
    else alert(data.error || 'Registration failed');
  }

  async function login(){
    const res = await fetch(API('/auth/login'), {
      method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if(data.token){ localStorage.setItem('token', data.token); setToken(data.token); alert('Logged in'); fetchCart(); }
    else alert(data.error || 'Login failed');
  }

  async function addToCart(productId){
    const res = await fetch(API('/cart'), { method:'POST', headers:{ 'Content-Type':'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ productId, qty:1 }) });
    if (res.status === 401) { alert('Please login'); return; }
    await fetchCart();
    alert('Added to cart');
  }

  async function checkout(){
    const res = await fetch(API('/checkout'), { method:'POST', headers:{ Authorization: 'Bearer ' + token } });
    if (res.status === 401) { alert('Please login'); return; }
    const data = await res.json();
    if (data.success) { alert('Checkout simulated'); fetchCart(); }
  }

  return (<div style={{ fontFamily: 'Arial, sans-serif', maxWidth: 1000, margin: '24px auto' }}>
    <header style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background:'#232f3e', color:'white', padding:12 }}>
      <div style={{ fontWeight:700 }}>Amazon-Clone (Upgraded)</div>
      <div>
        { token ? <button onClick={()=>{ localStorage.removeItem('token'); setToken(''); setCart([]); }}>Logout</button> : null }
      </div>
    </header>
    <div style={{ display:'flex', gap:20, marginTop:20 }}>
      <div style={{ flex:2 }}>
        <h2>Products</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:16 }}>
          {products.map(p => (
            <div key={p.id} style={{ background:'white', padding:12, borderRadius:8, boxShadow:'0 1px 3px rgba(0,0,0,0.08)'}}>
              <img src={p.image_url} style={{ width:'100%', height:140, objectFit:'cover', borderRadius:6 }} />
              <div style={{ marginTop:8, fontWeight:700 }}>{p.title}</div>
              <div style={{ fontSize:13, color:'#444' }}>{p.description}</div>
              <div style={{ fontWeight:700, marginTop:8 }}>${p.price.toFixed(2)}</div>
              <button style={{ background:'#ff9900', border:0, padding:'8px 10px', borderRadius:6, cursor:'pointer', marginTop:8 }} onClick={()=>addToCart(p.id)}>Add to cart</button>
            </div>
          ))}
        </div>
      </div>
      <div style={{ flex:1 }}>
        <div style={{ background:'white', padding:12, borderRadius:8 }}>
          <h3>Account</h3>
          { token ? <div>Logged in as { /* no email in token display for simplicity */ 'user' }</div> : (
            <div>
              <input placeholder='Email' value={email} onChange={e=>setEmail(e.target.value)} style={{ width:'100%', marginBottom:8 }} />
              <input placeholder='Password' type='password' value={password} onChange={e=>setPassword(e.target.value)} style={{ width:'100%', marginBottom:8 }} />
              <button onClick={login} style={{ marginRight:8 }}>Login</button>
              <button onClick={register}>Register</button>
            </div>
          )}
        </div>
        <div style={{ background:'white', padding:12, borderRadius:8, marginTop:16 }}>
          <h3>Cart</h3>
          {cart.length === 0 ? <div>Cart is empty</div> : <div>
            <ul>{cart.map(c => <li key={c.productId}>{c.title} — qty: {c.qty} — ${ (c.price * c.qty).toFixed(2) }</li>)}</ul>
            <button onClick={checkout}>Checkout</button>
          </div>}
        </div>
      </div>
    </div>
  </div>)
}

export default App