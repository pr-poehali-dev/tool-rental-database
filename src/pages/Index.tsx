import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';

interface Equipment {
  id: number;
  name: string;
  category: string;
  price: number;
  period: string;
  status: 'available' | 'rented' | 'maintenance';
  image: string;
  specs: string[];
}

interface Order {
  id: number;
  equipment: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'pending' | 'completed';
  total: number;
  contractNumber?: string;
}

interface Client {
  companyName: string;
  inn: string;
  kpp: string;
  legalAddress: string;
  contactPerson: string;
  phone: string;
  email: string;
  bankName: string;
  accountNumber: string;
  correspondentAccount: string;
  bik: string;
}

const API_URL = 'https://functions.poehali.dev/3f9b7830-8825-4dc9-bec0-312288aae61e';

const Index = () => {
  const [activeTab, setActiveTab] = useState('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState<Equipment[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { sender: 'manager', text: 'Здравствуйте! Чем могу помочь?' }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [client, setClient] = useState<Client>({
    companyName: '',
    inn: '',
    kpp: '',
    legalAddress: '',
    contactPerson: '',
    phone: '',
    email: '',
    bankName: '',
    accountNumber: '',
    correspondentAccount: '',
    bik: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEquipment();
    loadOrders();
    loadClient();
  }, []);

  const loadEquipment = async () => {
    try {
      const params = new URLSearchParams();
      params.append('path', 'equipment');
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (searchQuery) params.append('search', searchQuery);
      
      const response = await fetch(`${API_URL}?${params}`);
      const data = await response.json();
      setEquipment(data);
    } catch (error) {
      console.error('Ошибка загрузки оборудования:', error);
    }
  };

  const loadOrders = async () => {
    try {
      const response = await fetch(`${API_URL}?path=orders`);
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error('Ошибка загрузки заказов:', error);
    }
  };

  const loadClient = async () => {
    try {
      const response = await fetch(`${API_URL}?path=client`);
      const data = await response.json();
      if (data.companyName) setClient(data);
    } catch (error) {
      console.error('Ошибка загрузки клиента:', error);
    }
  };

  useEffect(() => {
    loadEquipment();
  }, [selectedCategory, searchQuery]);

  const categories = ['all', 'Электроинструмент', 'Строительное оборудование', 'Измерительный инструмент', 'Энергетическое оборудование'];

  const filteredEquipment = equipment.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (item: Equipment) => {
    setCart([...cart, item]);
  };

  const removeFromCart = (id: number) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const sendMessage = () => {
    if (newMessage.trim()) {
      setChatMessages([...chatMessages, { sender: 'client', text: newMessage }]);
      setNewMessage('');
      setTimeout(() => {
        setChatMessages(prev => [...prev, { sender: 'manager', text: 'Спасибо за ваше сообщение! Менеджер ответит в ближайшее время.' }]);
      }, 1000);
    }
  };

  const generateContract = async () => {
    setLoading(true);
    try {
      const equipmentIds = cart.map(item => item.id);
      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + 7);
      
      const response = await fetch(`${API_URL}?path=order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipmentIds,
          startDate: today.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        })
      });
      
      const data = await response.json();
      const total = cart.reduce((sum, item) => sum + item.price, 0);
      
      alert(`Договор аренды №${data.contractNumber}\n\nДата: ${today.toLocaleDateString('ru-RU')}\nАрендатор: ${client.companyName || 'Клиент'}\nАрендодатель: ООО "ПрокатПро"\n\nОборудование:\n${cart.map(i => `${i.name} - ${i.price}₽/${i.period}`).join('\n')}\n\nИтого: ${total}₽\n\nДоговор будет отправлен на вашу электронную почту в формате PDF.`);
      
      setCart([]);
      loadOrders();
    } catch (error) {
      console.error('Ошибка создания договора:', error);
      alert('Ошибка создания договора');
    } finally {
      setLoading(false);
    }
  };

  const saveClient = async () => {
    setLoading(true);
    try {
      await fetch(`${API_URL}?path=client`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(client)
      });
      alert('Данные сохранены');
    } catch (error) {
      console.error('Ошибка сохранения клиента:', error);
      alert('Ошибка сохранения данных');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Icon name="Wrench" className="text-primary-foreground" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold">ПрокатПро</h1>
                <p className="text-xs text-muted-foreground">Аренда профессионального оборудования</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="relative">
                    <Icon name="ShoppingCart" size={20} />
                    {cart.length > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center">{cart.length}</Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Корзина</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-4">
                    {cart.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">Корзина пуста</p>
                    ) : (
                      <>
                        <ScrollArea className="h-[400px]">
                          {cart.map((item) => (
                            <div key={item.id} className="flex items-center gap-3 mb-4">
                              <img src={item.image} alt={item.name} className="w-16 h-16 rounded object-cover" />
                              <div className="flex-1">
                                <p className="font-medium text-sm">{item.name}</p>
                                <p className="text-sm text-muted-foreground">{item.price}₽/{item.period}</p>
                              </div>
                              <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.id)}>
                                <Icon name="X" size={16} />
                              </Button>
                            </div>
                          ))}
                        </ScrollArea>
                        <Separator />
                        <div className="space-y-2">
                          <div className="flex justify-between font-bold">
                            <span>Итого:</span>
                            <span>{cart.reduce((sum, item) => sum + item.price, 0)}₽</span>
                          </div>
                          <Button className="w-full" onClick={generateContract} disabled={loading}>
                            <Icon name="FileText" size={16} className="mr-2" />
                            {loading ? 'Создание...' : 'Сформировать договор'}
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
              <Button variant="outline" size="icon" onClick={() => setChatOpen(!chatOpen)}>
                <Icon name="MessageSquare" size={20} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-5 mb-8">
            <TabsTrigger value="catalog">
              <Icon name="Package" size={16} className="mr-2" />
              Каталог
            </TabsTrigger>
            <TabsTrigger value="orders">
              <Icon name="ClipboardList" size={16} className="mr-2" />
              Заказы
            </TabsTrigger>
            <TabsTrigger value="profile">
              <Icon name="User" size={16} className="mr-2" />
              Профиль
            </TabsTrigger>
            <TabsTrigger value="history">
              <Icon name="History" size={16} className="mr-2" />
              История
            </TabsTrigger>
            <TabsTrigger value="payments">
              <Icon name="CreditCard" size={16} className="mr-2" />
              Платежи
            </TabsTrigger>
          </TabsList>

          <TabsContent value="catalog" className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Icon name="Search" size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Поиск оборудования..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {categories.map(cat => (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat === 'all' ? 'Все' : cat}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEquipment.map((item) => (
                <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative">
                    <img src={item.image} alt={item.name} className="w-full h-48 object-cover" />
                    <Badge className={`absolute top-2 right-2 ${
                      item.status === 'available' ? 'bg-green-500' : 
                      item.status === 'rented' ? 'bg-orange-500' : 'bg-gray-500'
                    }`}>
                      {item.status === 'available' ? 'Доступно' : 
                       item.status === 'rented' ? 'Арендовано' : 'На обслуживании'}
                    </Badge>
                  </div>
                  <div className="p-4">
                    <Badge variant="outline" className="mb-2">{item.category}</Badge>
                    <h3 className="font-bold text-lg mb-2">{item.name}</h3>
                    <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                      {item.specs.map((spec, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <Icon name="Check" size={14} className="text-primary" />
                          {spec}
                        </li>
                      ))}
                    </ul>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-primary">{item.price}₽</p>
                        <p className="text-xs text-muted-foreground">за {item.period}</p>
                      </div>
                      <Button 
                        onClick={() => addToCart(item)}
                        disabled={item.status !== 'available'}
                      >
                        <Icon name="Plus" size={16} className="mr-2" />
                        В корзину
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="orders">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold mb-4">Активные заказы</h2>
              {orders.map((order) => (
                <Card key={order.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-lg mb-2">{order.equipment}</h3>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Icon name="Calendar" size={14} />
                          {order.startDate} - {order.endDate}
                        </span>
                        <span className="flex items-center gap-1">
                          <Icon name="DollarSign" size={14} />
                          {order.total}₽
                        </span>
                      </div>
                    </div>
                    <Badge className={
                      order.status === 'active' ? 'bg-green-500' :
                      order.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-500'
                    }>
                      {order.status === 'active' ? 'Активен' :
                       order.status === 'pending' ? 'Ожидает' : 'Завершён'}
                    </Badge>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Icon name="FileText" size={14} className="mr-2" />
                          Просмотреть договор
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Договор аренды №{order.contractNumber || order.id}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Оборудование</p>
                            <p className="font-medium">{order.equipment}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Период аренды</p>
                            <p className="font-medium">{order.startDate} - {order.endDate}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Сумма</p>
                            <p className="font-bold text-xl">{order.total}₽</p>
                          </div>
                          <Button className="w-full">
                            <Icon name="Download" size={16} className="mr-2" />
                            Скачать PDF
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="profile">
            <Card className="p-6 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">Профиль компании</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Название организации</label>
                  <Input value={client.companyName} onChange={(e) => setClient({...client, companyName: e.target.value})} className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">ИНН</label>
                  <Input value={client.inn} onChange={(e) => setClient({...client, inn: e.target.value})} className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">КПП</label>
                  <Input value={client.kpp} onChange={(e) => setClient({...client, kpp: e.target.value})} className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Юридический адрес</label>
                  <Input value={client.legalAddress} onChange={(e) => setClient({...client, legalAddress: e.target.value})} className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Контактное лицо</label>
                  <Input value={client.contactPerson} onChange={(e) => setClient({...client, contactPerson: e.target.value})} className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Телефон</label>
                  <Input value={client.phone} onChange={(e) => setClient({...client, phone: e.target.value})} className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input value={client.email} onChange={(e) => setClient({...client, email: e.target.value})} type="email" className="mt-1" />
                </div>
                <Button className="w-full" onClick={saveClient} disabled={loading}>
                  <Icon name="Save" size={16} className="mr-2" />
                  {loading ? 'Сохранение...' : 'Сохранить изменения'}
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">История аренды</h2>
              <div className="space-y-3">
                {[...orders].reverse().map((order) => (
                  <Card key={order.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                          <Icon name="Package" size={20} />
                        </div>
                        <div>
                          <p className="font-medium">{order.equipment}</p>
                          <p className="text-sm text-muted-foreground">{order.startDate} - {order.endDate}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{order.total}₽</p>
                        <Badge variant="outline" className="mt-1">
                          {order.status === 'completed' ? 'Завершено' : 'В процессе'}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="payments">
            <Card className="p-6 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">Платёжные реквизиты</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Банк</label>
                  <Input value={client.bankName} onChange={(e) => setClient({...client, bankName: e.target.value})} className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Расчётный счёт</label>
                  <Input value={client.accountNumber} onChange={(e) => setClient({...client, accountNumber: e.target.value})} className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Корреспондентский счёт</label>
                  <Input value={client.correspondentAccount} onChange={(e) => setClient({...client, correspondentAccount: e.target.value})} className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">БИК</label>
                  <Input value={client.bik} onChange={(e) => setClient({...client, bik: e.target.value})} className="mt-1" />
                </div>
                <Separator className="my-6" />
                <div className="space-y-3">
                  <h3 className="font-bold">История платежей</h3>
                  {orders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between py-2 border-b">
                      <div>
                        <p className="font-medium text-sm">{order.equipment}</p>
                        <p className="text-xs text-muted-foreground">{order.startDate}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{order.total}₽</p>
                        <Badge variant="outline" className="text-xs">Оплачено</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {chatOpen && (
        <div className="fixed bottom-4 right-4 w-96 h-[500px] bg-card border rounded-lg shadow-2xl flex flex-col z-50">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <Icon name="Headphones" className="text-primary-foreground" size={20} />
              </div>
              <div>
                <p className="font-bold">Поддержка</p>
                <p className="text-xs text-muted-foreground">Онлайн</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setChatOpen(false)}>
              <Icon name="X" size={20} />
            </Button>
          </div>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender === 'client' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-lg ${
                    msg.sender === 'client' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}>
                    <p className="text-sm">{msg.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                placeholder="Введите сообщение..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              />
              <Button size="icon" onClick={sendMessage}>
                <Icon name="Send" size={20} />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;