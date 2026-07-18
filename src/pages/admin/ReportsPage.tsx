import { useState } from 'react';
import { Box, Typography, Paper, Grid, Tabs, Tab } from '@mui/material';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, PieChart, Pie, Cell, BarChart, Bar, ComposedChart, Line
} from 'recharts';
import { useInventoryStore } from '../../store/useInventoryStore';
import { useSalesStore } from '../../store/useSalesStore';
import { useTheme, alpha } from '@mui/material/styles';

const REVENUE_DATA = [
  { name: 'Mon', revenue: 4000, profit: 2400 },
  { name: 'Tue', revenue: 3000, profit: 1398 },
  { name: 'Wed', revenue: 2000, profit: 9800 },
  { name: 'Thu', revenue: 2780, profit: 3908 },
  { name: 'Fri', revenue: 1890, profit: 4800 },
  { name: 'Sat', revenue: 2390, profit: 3800 },
  { name: 'Sun', revenue: 3490, profit: 4300 },
];

const BEST_SELLERS = [
  { name: 'Espresso Roast 1kg', sales: 400 },
  { name: 'Ceramic Pour Over', sales: 300 },
  { name: 'Matcha Wholesale', sales: 300 },
  { name: 'Syrup Pump', sales: 200 },
];

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

export default function ReportsPage() {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const { products, ingredients } = useInventoryStore();
  const { sales } = useSalesStore();

  const inventoryCategoryData = products.reduce<{ name: string; items: number; value: number }[]>((acc, product) => {
    if (!product.category) return acc;
    const existing = acc.find(c => c.name === product.category);
    const value = product.price * (product.stock_quantity || 0);
    if (existing) {
      existing.items += (product.stock_quantity || 0);
      existing.value += value;
    } else {
      acc.push({ name: product.category, items: product.stock_quantity || 0, value });
    }
    return acc;
  }, []);

  const totalIngredientValue = ingredients.reduce((sum, ing) => sum + (ing.cost_per_unit * ing.stock_quantity), 0);
  const totalRetailValue = products.reduce((sum, p) => sum + (p.price * (p.stock_quantity || 0)), 0);

  const staffSalesData = sales.reduce<{ name: string; transactions: number; revenue: number }[]>((acc, sale) => {
    const cashier = sale.cashier || 'System';
    const existing = acc.find(s => s.name === cashier);
    if (existing) {
      existing.transactions += 1;
      existing.revenue += sale.total;
    } else {
      acc.push({ name: cashier, transactions: 1, revenue: sale.total });
    }
    return acc;
  }, []);

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>Reports Intelligence Center</Typography>
      <Typography color="text.secondary" mb={4}>Visual insights into revenue, inventory margins, and staff performance.</Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Tabs value={activeTab} onChange={(_, nv) => setActiveTab(nv)} textColor="primary" indicatorColor="primary">
          <Tab label="Sales Performance" sx={{ fontWeight: 700, textTransform: 'none', fontSize: '1rem' }} />
          <Tab label="Inventory Valuation" sx={{ fontWeight: 700, textTransform: 'none', fontSize: '1rem' }} />
          <Tab label="Staff Activity" sx={{ fontWeight: 700, textTransform: 'none', fontSize: '1rem' }} />
        </Tabs>
      </Box>

      {activeTab === 0 && (
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid #e2e8f0', height: 450 }}>
              <Typography variant="h6" fontWeight={800} mb={3}>Weekly Revenue Trends</Typography>
              <ResponsiveContainer width="100%" height="85%">
                <AreaChart data={REVENUE_DATA} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `$${val}`} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid #e2e8f0', height: 450 }}>
              <Typography variant="h6" fontWeight={800} mb={3}>Top Movers</Typography>
              <ResponsiveContainer width="100%" height="85%">
                <PieChart>
                  <Pie data={BEST_SELLERS} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="sales">
                    {BEST_SELLERS.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid #e2e8f0', height: 450 }}>
              <Typography variant="h6" fontWeight={800} mb={3}>Capital Distribution by Category</Typography>
              <ResponsiveContainer width="100%" height="85%">
                <BarChart data={inventoryCategoryData.length > 0 ? inventoryCategoryData : [{name: 'No Data', items: 0, value: 0}]} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `$${val}`} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="value" name="Total Retail Value" fill={theme.palette.primary.main} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 5 }}>
            <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid #e2e8f0', height: 450, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" fontWeight={800} mb={3}>Asset Liquidity Snapshot</Typography>
              
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4 }}>
                <Box sx={{ p: 3, borderRadius: 4, bgcolor: alpha(theme.palette.secondary.main, 0.05), border: `1px solid ${alpha(theme.palette.secondary.main, 0.1)}` }}>
                  <Typography variant="overline" color="text.secondary" fontWeight={800}>Tied Capital (Raw Ingredients)</Typography>
                  <Typography variant="h3" fontWeight={900} color="secondary.main">${totalIngredientValue.toFixed(2)}</Typography>
                </Box>
                
                <Box sx={{ p: 3, borderRadius: 4, bgcolor: alpha(theme.palette.success.main, 0.05), border: `1px solid ${alpha(theme.palette.success.main, 0.1)}` }}>
                  <Typography variant="overline" color="text.secondary" fontWeight={800}>Projected Retail Value (Finished Goods)</Typography>
                  <Typography variant="h3" fontWeight={900} color="success.main">${totalRetailValue.toFixed(2)}</Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {activeTab === 2 && (
        <Grid container spacing={4}>
          <Grid size={{ xs: 12 }}>
            <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid #e2e8f0', height: 500 }}>
              <Typography variant="h6" fontWeight={800} mb={1}>Cashier Performance Matrix</Typography>
              <Typography color="text.secondary" mb={4}>Correlating transaction volume against total revenue generated per staff member.</Typography>
              
              <ResponsiveContainer width="100%" height="75%">
                <ComposedChart data={staffSalesData.length > 0 ? staffSalesData : [{name: 'No Sales Yet', revenue: 0, transactions: 0}]} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid stroke="#f5f5f5" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} scale="band" />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="revenue" name="Gross Revenue" barSize={40} fill={theme.palette.primary.light} radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="transactions" name="Tx Count" stroke={theme.palette.secondary.main} strokeWidth={4} dot={{ r: 6 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
