"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  CreditCard,
  TrendingUp,
  Calendar,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  Euro,
  Users,
  FileText,
  Activity
} from "lucide-react";

// Types
interface Subscription {
  id: string;
  plan: "starter" | "professional" | "enterprise";
  status: "active" | "past_due" | "cancelled" | "trial";
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  trial_end?: string;
}

interface UsageStats {
  users: number;
  tras: number;
  lmras: number;
  storage_gb: number;
  api_calls: number;
}

interface PaymentHistory {
  id: string;
  date: string;
  amount: number;
  status: "succeeded" | "pending" | "failed";
  description: string;
  invoice_url?: string;
}

interface PaymentMethod {
  id: string;
  type: "card" | "sepa_debit";
  last4: string;
  brand: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
}

// Mock data - replace with real API calls
const mockSubscription: Subscription = {
  id: "sub_1234567890",
  plan: "professional",
  status: "active",
  current_period_start: "2025-10-01",
  current_period_end: "2025-11-01",
  cancel_at_period_end: false,
  trial_end: "2025-10-15"
};

const mockUsageStats: UsageStats = {
  users: 8,
  tras: 156,
  lmras: 324,
  storage_gb: 2.3,
  api_calls: 15420
};

const mockPaymentHistory: PaymentHistory[] = [
  {
    id: "pi_1234567890",
    date: "2025-10-01",
    amount: 149,
    status: "succeeded",
    description: "SafeWork Pro Professional - Monthly",
    invoice_url: "#"
  },
  {
    id: "pi_1234567891",
    date: "2025-09-01",
    amount: 149,
    status: "succeeded",
    description: "SafeWork Pro Professional - Monthly",
    invoice_url: "#"
  },
  {
    id: "pi_1234567892",
    date: "2025-08-01",
    amount: 149,
    status: "succeeded",
    description: "SafeWork Pro Professional - Monthly",
    invoice_url: "#"
  }
];

const mockPaymentMethod: PaymentMethod = {
  id: "pm_1234567890",
  type: "card",
  last4: "4242",
  brand: "visa",
  exp_month: 12,
  exp_year: 2026,
  is_default: true
};

// Plan details - Aligned with documented pricing strategy
const plans = {
  starter: {
    name: "Starter",
    price: 49,
    features: ["5 gebruikers", "50 TRAs", "100 LMRAs", "Basis rapportages", "Email ondersteuning"]
  },
  professional: {
    name: "Professional",
    price: 149,
    features: ["25 gebruikers", "Onbeperkt TRAs/LMRAs", "Geavanceerde rapportages", "API toegang", "SSO integratie", "Telefoon ondersteuning"]
  },
  enterprise: {
    name: "Enterprise",
    price: 499,
    features: ["Onbeperkt gebruikers", "Alle Professional features", "Custom workflows", "Dedicated support", "SLA garantie", "White-label optie"]
  }
};

export default function BillingPage() {
  const [subscription] = useState<Subscription>(mockSubscription);
  const [usageStats] = useState<UsageStats>(mockUsageStats);
  const [paymentHistory] = useState<PaymentHistory[]>(mockPaymentHistory);
  const [paymentMethod] = useState<PaymentMethod>(mockPaymentMethod);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("usage");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modal states
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [showEditPaymentModal, setShowEditPaymentModal] = useState(false);

  // Form states
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [paymentForm, setPaymentForm] = useState({
    // Credit Card
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    cardholderName: '',
    // iDEAL
    idealBank: '',
    // Bancontact
    bancontactCardNumber: '',
    bancontactExpiryMonth: '',
    bancontactExpiryYear: '',
    // SEPA
    iban: '',
    accountHolderName: '',
    // PayPal
    paypalEmail: '',
    isDefault: false
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const currentPlan = plans[subscription.plan];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { variant: 'success' as const, label: 'Actief', icon: CheckCircle },
      trial: { variant: 'info' as const, label: 'Proefperiode', icon: Clock },
      past_due: { variant: 'error' as const, label: 'Achterstallig', icon: AlertTriangle },
      cancelled: { variant: 'secondary' as const, label: 'Geannuleerd', icon: AlertTriangle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('nl-NL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date(dateString));
  };

  // Handler functions
  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleDownloadInvoice = async (invoiceId: string) => {
    setActionLoading(`download-${invoiceId}`);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Create mock PDF download
      const blob = new Blob(['Mock PDF content for invoice'], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `factuur-${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showMessage('success', 'Factuur succesvol gedownload');
    } catch (error) {
      showMessage('error', 'Fout bij downloaden van factuur');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePlanChange = async (newPlan: string) => {
    setActionLoading(`plan-${newPlan}`);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      showMessage('success', `Successfully upgraded to ${plans[newPlan as keyof typeof plans].name}`);
    } catch (error) {
      showMessage('error', 'Fout bij wijziging abonnement');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddPaymentMethod = () => {
    openAddPaymentModal();
  };

  const handleEditPaymentMethod = () => {
    openEditPaymentModal();
  };

  const handleDownloadCurrentInvoice = async () => {
    setActionLoading('download-current');
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Create mock PDF download
      const blob = new Blob(['Mock PDF content for current invoice'], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `factuur-${subscription.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showMessage('success', 'Huidige factuur gedownload');
    } catch (error) {
      showMessage('error', 'Fout bij downloaden factuur');
    } finally {
      setActionLoading(null);
    }
  };

  const isLoading = (action: string) => actionLoading === action;

  // Form validation
  const validatePaymentForm = () => {
    const errors: Record<string, string> = {};

    if (selectedPaymentMethod === 'ideal') {
      if (!paymentForm.idealBank) {
        errors.idealBank = 'Selecteer uw bank';
      }
    }

    if (selectedPaymentMethod === 'bancontact') {
      if (!paymentForm.bancontactCardNumber || paymentForm.bancontactCardNumber.replace(/\s/g, '').length < 16) {
        errors.bancontactCardNumber = 'Geldig kaartnummer is verplicht (minimaal 16 cijfers)';
      }
      if (!paymentForm.bancontactExpiryMonth || !paymentForm.bancontactExpiryYear) {
        errors.bancontactExpiry = 'Vervaldatum is verplicht';
      }
    }

    if (selectedPaymentMethod === 'sepa') {
      if (!paymentForm.iban || !/^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/.test(paymentForm.iban.replace(/\s/g, ''))) {
        errors.iban = 'Geldig IBAN nummer is verplicht';
      }
      if (!paymentForm.accountHolderName.trim()) {
        errors.accountHolderName = 'Naam rekeninghouder is verplicht';
      }
    }

    if (selectedPaymentMethod === 'paypal') {
      if (!paymentForm.paypalEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paymentForm.paypalEmail)) {
        errors.paypalEmail = 'Geldig e-mailadres is verplicht';
      }
    }

    if (selectedPaymentMethod === 'creditcard') {
      if (!paymentForm.cardNumber || paymentForm.cardNumber.replace(/\s/g, '').length < 16) {
        errors.cardNumber = 'Geldig kaartnummer is verplicht (minimaal 16 cijfers)';
      }
      if (!paymentForm.expiryMonth || !paymentForm.expiryYear) {
        errors.expiry = 'Vervaldatum is verplicht';
      }
      if (!paymentForm.cvv || paymentForm.cvv.length < 3) {
        errors.cvv = 'CVV is verplicht (minimaal 3 cijfers)';
      }
      if (!paymentForm.cardholderName.trim()) {
        errors.cardholderName = 'Kaarthouder naam is verplicht';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'cardNumber') {
      value = formatCardNumber(value);
    }
    setPaymentForm(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const resetPaymentForm = () => {
    setPaymentForm({
      cardNumber: '',
      expiryMonth: '',
      expiryYear: '',
      cvv: '',
      cardholderName: '',
      idealBank: '',
      bancontactCardNumber: '',
      bancontactExpiryMonth: '',
      bancontactExpiryYear: '',
      iban: '',
      accountHolderName: '',
      paypalEmail: '',
      isDefault: false
    });
    setFormErrors({});
    setSelectedPaymentMethod('');
  };

  const openAddPaymentModal = () => {
    resetPaymentForm();
    setShowAddPaymentModal(true);
  };

  const openEditPaymentModal = () => {
    setPaymentForm({
      cardNumber: '4242 4242 4242 4242',
      expiryMonth: paymentMethod.exp_month.toString(),
      expiryYear: paymentMethod.exp_year.toString(),
      cvv: '123',
      cardholderName: 'Jan Jansen',
      idealBank: '',
      bancontactCardNumber: '',
      bancontactExpiryMonth: '',
      bancontactExpiryYear: '',
      iban: '',
      accountHolderName: '',
      paypalEmail: '',
      isDefault: paymentMethod.is_default
    });
    setFormErrors({});
    setSelectedPaymentMethod('creditcard');
    setShowEditPaymentModal(true);
  };

  const handleSavePaymentMethod = async (isEdit: boolean) => {
    if (!validatePaymentForm()) return;

    setActionLoading(isEdit ? 'save-edit-payment' : 'save-add-payment');
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      showMessage('success', isEdit ? 'Betaalmethode bijgewerkt' : 'Nieuwe betaalmethode toegevoegd');
      setShowAddPaymentModal(false);
      setShowEditPaymentModal(false);
      resetPaymentForm();
    } catch (error) {
      showMessage('error', 'Fout bij opslaan betaalmethode');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Facturering & Abonnement</h1>
        <p className="text-gray-600">
          Beheer uw abonnement, bekijk gebruiksstatistieken en download facturen
        </p>
      </div>

      {/* Messages */}
      {message && (
        <Alert
          className="mb-6"
          variant={message.type === 'success' ? 'success' : 'error'}
          title={message.type === 'success' ? 'Succes' : 'Fout'}
        >
          {message.text}
        </Alert>
      )}

      {/* Current Subscription Overview */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Huidig Abonnement</span>
            {getStatusBadge(subscription.status)}
          </CardTitle>
          <CardDescription>
            {subscription.status === 'trial'
              ? `Proefperiode eindigt op ${formatDate(subscription.trial_end!)}`
              : `Huidige periode: ${formatDate(subscription.current_period_start)} - ${formatDate(subscription.current_period_end)}`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xl font-semibold sm:text-2xl">{currentPlan.name}</h3>
              <p className="text-gray-600">{formatCurrency(currentPlan.price)} per maand</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
              <Button
                variant="outline"
                onClick={handleDownloadCurrentInvoice}
                disabled={isLoading('download-current')}
                loading={isLoading('download-current')}
                className="w-full sm:w-auto"
              >
                <Download className="w-4 h-4 mr-2" />
                Factuur Downloaden
              </Button>
              <Button
                onClick={() => handlePlanChange('professional')}
                disabled={isLoading('plan-professional')}
                loading={isLoading('plan-professional')}
                className="w-full sm:w-auto"
              >
                Plan Wijzigen
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-lg mb-6 sm:flex-nowrap">
        <button
          onClick={() => setActiveTab('usage')}
          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex-1 sm:flex-none sm:px-4 ${
            activeTab === 'usage'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Gebruik
        </button>
        <button
          onClick={() => setActiveTab('payment-methods')}
          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex-1 sm:flex-none sm:px-4 ${
            activeTab === 'payment-methods'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Betaalmethoden
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex-1 sm:flex-none sm:px-4 ${
            activeTab === 'history'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Factuurhistorie
        </button>
        <button
          onClick={() => setActiveTab('plans')}
          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex-1 sm:flex-none sm:px-4 ${
            activeTab === 'plans'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Plannen
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'usage' && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Actieve Gebruikers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usageStats.users}/25</div>
              <p className="text-xs text-muted-foreground">
                {Math.round((usageStats.users / 25) * 100)}% van limiet gebruikt
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">TRA's Deze Maand</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usageStats.tras}</div>
              <p className="text-xs text-muted-foreground">
                Onbeperkt in Professional plan
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">LMRA's Deze Maand</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usageStats.lmras}</div>
              <p className="text-xs text-muted-foreground">
                Onbeperkt in Professional plan
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Opslag Gebruik</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usageStats.storage_gb} GB</div>
              <p className="text-xs text-muted-foreground">
                23% van 10 GB limiet gebruikt
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">API Calls</CardTitle>
              <Euro className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usageStats.api_calls.toLocaleString('nl-NL')}</div>
              <p className="text-xs text-muted-foreground">
                15,420 verzoeken deze maand
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Maandelijkse Kosten</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(currentPlan.price)}</div>
              <p className="text-xs text-muted-foreground">
                Volgende factuur: {formatDate(subscription.current_period_end)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'payment-methods' && (
        <Card>
          <CardHeader>
            <CardTitle>Betaalmethoden</CardTitle>
            <CardDescription>
              Beheer uw betalingsgegevens en standaard betaalmethode
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <CreditCard className="w-8 h-8 text-gray-400" />
                <div>
                  <p className="font-medium">
                    •••• •••• •••• {paymentMethod.last4}
                  </p>
                  <p className="text-sm text-gray-600">
                    {paymentMethod.brand.toUpperCase()} eindigend op {paymentMethod.last4} •
                    Verloopt {paymentMethod.exp_month}/{paymentMethod.exp_year}
                  </p>
                </div>
              </div>
              {paymentMethod.is_default && (
                <Badge variant="secondary">Standaard</Badge>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
              <Button
                variant="outline"
                onClick={handleAddPaymentMethod}
                disabled={isLoading('add-payment')}
                loading={isLoading('add-payment')}
                className="w-full sm:w-auto"
              >
                Nieuwe Betaalmethode Toevoegen
              </Button>
              <Button
                variant="outline"
                onClick={handleEditPaymentMethod}
                disabled={isLoading('edit-payment')}
                loading={isLoading('edit-payment')}
                className="w-full sm:w-auto"
              >
                Bewerken
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'history' && (
        <Card>
          <CardHeader>
            <CardTitle>Factuurhistorie</CardTitle>
            <CardDescription>
              Overzicht van alle facturen en betalingen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {paymentHistory.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      payment.status === 'succeeded' ? 'bg-green-500' :
                      payment.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    <div>
                      <p className="font-medium">{payment.description}</p>
                      <p className="text-sm text-gray-600">
                        {formatDate(payment.date)} • {payment.status === 'succeeded' ? 'Betaald' :
                         payment.status === 'pending' ? 'In behandeling' : 'Mislukt'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-3">
                    <span className="font-semibold">{formatCurrency(payment.amount)}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadInvoice(payment.id)}
                      disabled={isLoading(`download-${payment.id}`)}
                      loading={isLoading(`download-${payment.id}`)}
                      className="w-full sm:w-auto"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      PDF
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'plans' && (
        <div className="grid gap-6 md:grid-cols-3">
          {Object.entries(plans).map(([key, plan]) => (
            <Card key={key} className={`relative ${subscription.plan === key ? 'ring-2 ring-blue-500' : ''}`}>
              {subscription.plan === key && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-500">Huidig Plan</Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-center">{plan.name}</CardTitle>
                <div className="text-center">
                  <span className="text-3xl font-bold">{formatCurrency(plan.price)}</span>
                  <span className="text-gray-600">/maand</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full mt-4"
                  variant={subscription.plan === key ? "secondary" : "primary"}
                  disabled={subscription.plan === key}
                  onClick={() => subscription.plan !== key && handlePlanChange(key)}
                  loading={isLoading(`plan-${key}`)}
                  size="sm"
                >
                  {subscription.plan === key ? 'Huidig Plan' : `Upgrade naar ${plan.name}`}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Alerts */}
      {subscription.status === 'trial' && (
        <Alert className="mt-8" title="Proefperiode Eindigt Spoedig">
          <div className="flex items-start gap-3">
            <Clock className="h-4 w-4 mt-0.5" />
            <div>
              Uw proefperiode eindigt op {formatDate(subscription.trial_end!)}.
              Upgrade naar een betaald plan om uw account actief te houden.
            </div>
          </div>
        </Alert>
      )}

      {subscription.cancel_at_period_end && (
        <Alert className="mt-8" title="Abonnement Wordt Geannuleerd">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 mt-0.5" />
            <div>
              Uw abonnement wordt geannuleerd aan het einde van de huidige periode op {formatDate(subscription.current_period_end)}.
              U kunt dit annuleren om uw abonnement actief te houden.
            </div>
          </div>
        </Alert>
      )}

      {/* Add Payment Method Modal */}
      {showAddPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Nieuwe Betaalmethode Toevoegen</h3>
              <button
                onClick={() => setShowAddPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {!selectedPaymentMethod ? (
              // Payment Method Selection
              <div className="space-y-4">
                <p className="text-gray-600 mb-4">Kies uw gewenste betaalmethode:</p>

                <div className="grid gap-3">
                  <button
                    onClick={() => setSelectedPaymentMethod('ideal')}
                    className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <div className="w-12 h-8 bg-orange-500 rounded mr-3 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">iD</span>
                    </div>
                    <div className="text-left">
                      <div className="font-medium">iDEAL</div>
                      <div className="text-sm text-gray-600">Bankoverschrijving via Nederlandse banken</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setSelectedPaymentMethod('bancontact')}
                    className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <div className="w-12 h-8 bg-red-600 rounded mr-3 flex items-center justify-center">
                      <span className="text-white font-bold text-xs">BC</span>
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Bancontact</div>
                      <div className="text-sm text-gray-600">Belgische betaalkaarten</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setSelectedPaymentMethod('sepa')}
                    className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <div className="w-12 h-8 bg-blue-600 rounded mr-3 flex items-center justify-center">
                      <span className="text-white font-bold text-xs">SEPA</span>
                    </div>
                    <div className="text-left">
                      <div className="font-medium">SEPA Automatische Incasso</div>
                      <div className="text-sm text-gray-600">Europese bankoverschrijving</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setSelectedPaymentMethod('paypal')}
                    className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <div className="w-12 h-8 bg-blue-800 rounded mr-3 flex items-center justify-center">
                      <span className="text-white font-bold text-xs">PP</span>
                    </div>
                    <div className="text-left">
                      <div className="font-medium">PayPal</div>
                      <div className="text-sm text-gray-600">Betaal met uw PayPal account</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setSelectedPaymentMethod('creditcard')}
                    className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <div className="w-12 h-8 bg-gray-600 rounded mr-3 flex items-center justify-center">
                      <span className="text-white font-bold text-xs">💳</span>
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Creditcard</div>
                      <div className="text-sm text-gray-600">Visa, Mastercard, American Express</div>
                    </div>
                  </button>
                </div>
              </div>
            ) : (
              // Payment Form Based on Selection
              <div className="space-y-4">
                <div className="flex items-center mb-4">
                  <button
                    onClick={() => setSelectedPaymentMethod('')}
                    className="text-blue-600 hover:text-blue-800 text-sm mr-2"
                  >
                    ← Wijzig betaalmethode
                  </button>
                </div>

                {selectedPaymentMethod === 'ideal' && (
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-orange-800 font-medium">iDEAL Betaling</div>
                      <div className="text-orange-600 text-sm">U wordt doorgestuurd naar uw bank</div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Selecteer uw bank
                      </label>
                      <select
                        value={paymentForm.idealBank}
                        onChange={(e) => handleInputChange('idealBank', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                          formErrors.idealBank ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Kies uw bank...</option>
                        <option value="abn-amro">ABN AMRO</option>
                        <option value="rabobank">Rabobank</option>
                        <option value="ing">ING</option>
                        <option value="sns">SNS Bank</option>
                        <option value="asn">ASN Bank</option>
                        <option value="regiobank">RegioBank</option>
                        <option value="triodos">Triodos Bank</option>
                        <option value="van-lanschot">Van Lanschot</option>
                        <option value="knab">Knab</option>
                        <option value="bunq">Bunq</option>
                      </select>
                      {formErrors.idealBank && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.idealBank}</p>
                      )}
                    </div>
                  </div>
                )}

                {selectedPaymentMethod === 'bancontact' && (
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-red-800 font-medium">Bancontact Betaling</div>
                      <div className="text-red-600 text-sm">Belgische betaalkaart</div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Kaartnummer
                      </label>
                      <input
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        value={paymentForm.bancontactCardNumber}
                        onChange={(e) => handleInputChange('bancontactCardNumber', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                          formErrors.bancontactCardNumber ? 'border-red-500' : 'border-gray-300'
                        }`}
                        maxLength={19}
                      />
                      {formErrors.bancontactCardNumber && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.bancontactCardNumber}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Vervalmaand
                        </label>
                        <select
                          value={paymentForm.bancontactExpiryMonth}
                          onChange={(e) => handleInputChange('bancontactExpiryMonth', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                            formErrors.bancontactExpiry ? 'border-red-500' : 'border-gray-300'
                          }`}
                        >
                          <option value="">MM</option>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                            <option key={month} value={month.toString().padStart(2, '0')}>
                              {month.toString().padStart(2, '0')}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Vervallyaar
                        </label>
                        <select
                          value={paymentForm.bancontactExpiryYear}
                          onChange={(e) => handleInputChange('bancontactExpiryYear', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                            formErrors.bancontactExpiry ? 'border-red-500' : 'border-gray-300'
                          }`}
                        >
                          <option value="">YYYY</option>
                          {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(year => (
                            <option key={year} value={year.toString()}>
                              {year}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {formErrors.bancontactExpiry && (
                      <p className="text-red-500 text-sm">{formErrors.bancontactExpiry}</p>
                    )}
                  </div>
                )}

                {selectedPaymentMethod === 'sepa' && (
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-blue-800 font-medium">SEPA Automatische Incasso</div>
                      <div className="text-blue-600 text-sm">Maandelijkse automatische afschrijving</div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        IBAN
                      </label>
                      <input
                        type="text"
                        placeholder="NL12 ABCD 3456 7890 12"
                        value={paymentForm.iban}
                        onChange={(e) => handleInputChange('iban', e.target.value.toUpperCase())}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          formErrors.iban ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {formErrors.iban && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.iban}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Naam rekeninghouder
                      </label>
                      <input
                        type="text"
                        placeholder="Jan Jansen"
                        value={paymentForm.accountHolderName}
                        onChange={(e) => handleInputChange('accountHolderName', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          formErrors.accountHolderName ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {formErrors.accountHolderName && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.accountHolderName}</p>
                      )}
                    </div>

                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <p className="text-yellow-800 text-sm">
                        <strong>Let op:</strong> Door verder te gaan geeft u SafeWork Pro toestemming om maandelijks het abonnementsbedrag automatisch van uw rekening af te schrijven.
                      </p>
                    </div>
                  </div>
                )}

                {selectedPaymentMethod === 'paypal' && (
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-blue-800 font-medium">PayPal Betaling</div>
                      <div className="text-blue-600 text-sm">Betaal met uw PayPal account</div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        PayPal Email
                      </label>
                      <input
                        type="email"
                        placeholder="uw@email.com"
                        value={paymentForm.paypalEmail}
                        onChange={(e) => handleInputChange('paypalEmail', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          formErrors.paypalEmail ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {formErrors.paypalEmail && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.paypalEmail}</p>
                      )}
                    </div>
                  </div>
                )}

                {selectedPaymentMethod === 'creditcard' && (
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-gray-800 font-medium">Creditcard Betaling</div>
                      <div className="text-gray-600 text-sm">Visa, Mastercard, American Express</div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Kaartnummer
                      </label>
                      <input
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        value={paymentForm.cardNumber}
                        onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          formErrors.cardNumber ? 'border-red-500' : 'border-gray-300'
                        }`}
                        maxLength={19}
                      />
                      {formErrors.cardNumber && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.cardNumber}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Maand
                        </label>
                        <select
                          value={paymentForm.expiryMonth}
                          onChange={(e) => handleInputChange('expiryMonth', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            formErrors.expiry ? 'border-red-500' : 'border-gray-300'
                          }`}
                        >
                          <option value="">MM</option>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                            <option key={month} value={month.toString().padStart(2, '0')}>
                              {month.toString().padStart(2, '0')}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Jaar
                        </label>
                        <select
                          value={paymentForm.expiryYear}
                          onChange={(e) => handleInputChange('expiryYear', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            formErrors.expiry ? 'border-red-500' : 'border-gray-300'
                          }`}
                        >
                          <option value="">YYYY</option>
                          {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(year => (
                            <option key={year} value={year.toString()}>
                              {year}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {formErrors.expiry && (
                      <p className="text-red-500 text-sm">{formErrors.expiry}</p>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        CVV
                      </label>
                      <input
                        type="text"
                        placeholder="123"
                        value={paymentForm.cvv}
                        onChange={(e) => handleInputChange('cvv', e.target.value.replace(/\D/g, ''))}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          formErrors.cvv ? 'border-red-500' : 'border-gray-300'
                        }`}
                        maxLength={4}
                      />
                      {formErrors.cvv && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.cvv}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Naam kaarthouder
                      </label>
                      <input
                        type="text"
                        placeholder="Jan Jansen"
                        value={paymentForm.cardholderName}
                        onChange={(e) => handleInputChange('cardholderName', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          formErrors.cardholderName ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {formErrors.cardholderName && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.cardholderName}</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={paymentForm.isDefault}
                    onChange={(e) => handleInputChange('isDefault', e.target.checked ? 'true' : 'false')}
                    className="mr-2"
                  />
                  <label htmlFor="isDefault" className="text-sm text-gray-700">
                    Stel in als standaard betaalmethode
                  </label>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddPaymentModal(false)}
                    className="flex-1"
                  >
                    Annuleren
                  </Button>
                  <Button
                    onClick={() => handleSavePaymentMethod(false)}
                    disabled={isLoading('save-add-payment')}
                    loading={isLoading('save-add-payment')}
                    className="flex-1"
                  >
                    Toevoegen
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Payment Method Modal */}
      {showEditPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Betaalmethode Bewerken</h3>
              <button
                onClick={() => setShowEditPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-blue-800 font-medium">Huidige Betaalmethode</div>
                <div className="text-blue-600 text-sm">•••• •••• •••• {paymentMethod.last4}</div>
              </div>

              <div className="grid gap-3">
                <button
                  onClick={() => setSelectedPaymentMethod('ideal')}
                  className={`flex items-center p-4 border rounded-lg transition-colors ${
                    selectedPaymentMethod === 'ideal'
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-orange-500 hover:bg-orange-50'
                  }`}
                >
                  <div className="w-12 h-8 bg-orange-500 rounded mr-3 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">iD</span>
                  </div>
                  <div className="text-left">
                    <div className="font-medium">iDEAL</div>
                    <div className="text-sm text-gray-600">Bankoverschrijving via Nederlandse banken</div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedPaymentMethod('bancontact')}
                  className={`flex items-center p-4 border rounded-lg transition-colors ${
                    selectedPaymentMethod === 'bancontact'
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-red-500 hover:bg-red-50'
                  }`}
                >
                  <div className="w-12 h-8 bg-red-600 rounded mr-3 flex items-center justify-center">
                    <span className="text-white font-bold text-xs">BC</span>
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Bancontact</div>
                    <div className="text-sm text-gray-600">Belgische betaalkaarten</div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedPaymentMethod('sepa')}
                  className={`flex items-center p-4 border rounded-lg transition-colors ${
                    selectedPaymentMethod === 'sepa'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50'
                  }`}
                >
                  <div className="w-12 h-8 bg-blue-600 rounded mr-3 flex items-center justify-center">
                    <span className="text-white font-bold text-xs">SEPA</span>
                  </div>
                  <div className="text-left">
                    <div className="font-medium">SEPA Automatische Incasso</div>
                    <div className="text-sm text-gray-600">Europese bankoverschrijving</div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedPaymentMethod('paypal')}
                  className={`flex items-center p-4 border rounded-lg transition-colors ${
                    selectedPaymentMethod === 'paypal'
                      ? 'border-blue-800 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-800 hover:bg-blue-50'
                  }`}
                >
                  <div className="w-12 h-8 bg-blue-800 rounded mr-3 flex items-center justify-center">
                    <span className="text-white font-bold text-xs">PP</span>
                  </div>
                  <div className="text-left">
                    <div className="font-medium">PayPal</div>
                    <div className="text-sm text-gray-600">Betaal met uw PayPal account</div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedPaymentMethod('creditcard')}
                  className={`flex items-center p-4 border rounded-lg transition-colors ${
                    selectedPaymentMethod === 'creditcard'
                      ? 'border-gray-500 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <div className="w-12 h-8 bg-gray-600 rounded mr-3 flex items-center justify-center">
                    <span className="text-white font-bold text-xs">💳</span>
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Creditcard</div>
                    <div className="text-sm text-gray-600">Visa, Mastercard, American Express</div>
                  </div>
                </button>
              </div>

              {/* Edit Form Fields - Only show when payment method is selected */}
              {selectedPaymentMethod && (
                <div className="mt-6 pt-6 border-t">
                  <div className="flex items-center mb-4">
                    <button
                      onClick={() => setSelectedPaymentMethod('')}
                      className="text-blue-600 hover:text-blue-800 text-sm mr-2"
                    >
                      ← Wijzig betaalmethode
                    </button>
                  </div>

                  {selectedPaymentMethod === 'ideal' && (
                    <div className="space-y-4">
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <div className="text-orange-800 font-medium">iDEAL Betaling Bewerken</div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Selecteer uw bank
                        </label>
                        <select
                          value={paymentForm.idealBank}
                          onChange={(e) => handleInputChange('idealBank', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                            formErrors.idealBank ? 'border-red-500' : 'border-gray-300'
                          }`}
                        >
                          <option value="">Kies uw bank...</option>
                          <option value="abn-amro">ABN AMRO</option>
                          <option value="rabobank">Rabobank</option>
                          <option value="ing">ING</option>
                          <option value="sns">SNS Bank</option>
                          <option value="asn">ASN Bank</option>
                          <option value="regiobank">RegioBank</option>
                          <option value="triodos">Triodos Bank</option>
                          <option value="van-lanschot">Van Lanschot</option>
                          <option value="knab">Knab</option>
                          <option value="bunq">Bunq</option>
                        </select>
                        {formErrors.idealBank && (
                          <p className="text-red-500 text-sm mt-1">{formErrors.idealBank}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedPaymentMethod === 'creditcard' && (
                    <div className="space-y-4">
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-gray-800 font-medium">Creditcard Bewerken</div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Kaartnummer
                        </label>
                        <input
                          type="text"
                          value={paymentForm.cardNumber}
                          onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            formErrors.cardNumber ? 'border-red-500' : 'border-gray-300'
                          }`}
                          maxLength={19}
                        />
                        {formErrors.cardNumber && (
                          <p className="text-red-500 text-sm mt-1">{formErrors.cardNumber}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Maand
                          </label>
                          <select
                            value={paymentForm.expiryMonth}
                            onChange={(e) => handleInputChange('expiryMonth', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              formErrors.expiry ? 'border-red-500' : 'border-gray-300'
                            }`}
                          >
                            <option value="">MM</option>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                              <option key={month} value={month.toString().padStart(2, '0')}>
                                {month.toString().padStart(2, '0')}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Jaar
                          </label>
                          <select
                            value={paymentForm.expiryYear}
                            onChange={(e) => handleInputChange('expiryYear', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              formErrors.expiry ? 'border-red-500' : 'border-gray-300'
                            }`}
                          >
                            <option value="">YYYY</option>
                            {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(year => (
                              <option key={year} value={year.toString()}>
                                {year}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      {formErrors.expiry && (
                        <p className="text-red-500 text-sm">{formErrors.expiry}</p>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          CVV
                        </label>
                        <input
                          type="text"
                          value={paymentForm.cvv}
                          onChange={(e) => handleInputChange('cvv', e.target.value.replace(/\D/g, ''))}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            formErrors.cvv ? 'border-red-500' : 'border-gray-300'
                          }`}
                          maxLength={4}
                        />
                        {formErrors.cvv && (
                          <p className="text-red-500 text-sm mt-1">{formErrors.cvv}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Naam kaarthouder
                        </label>
                        <input
                          type="text"
                          value={paymentForm.cardholderName}
                          onChange={(e) => handleInputChange('cardholderName', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            formErrors.cardholderName ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {formErrors.cardholderName && (
                          <p className="text-red-500 text-sm mt-1">{formErrors.cardholderName}</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isDefaultEdit"
                      checked={paymentForm.isDefault}
                      onChange={(e) => handleInputChange('isDefault', e.target.checked ? 'true' : 'false')}
                      className="mr-2"
                    />
                    <label htmlFor="isDefaultEdit" className="text-sm text-gray-700">
                      Stel in als standaard betaalmethode
                    </label>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Button
                      variant="outline"
                      onClick={() => setShowEditPaymentModal(false)}
                      className="flex-1"
                    >
                      Annuleren
                    </Button>
                    <Button
                      onClick={() => handleSavePaymentMethod(true)}
                      disabled={isLoading('save-edit-payment')}
                      loading={isLoading('save-edit-payment')}
                      className="flex-1"
                    >
                      Opslaan
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}