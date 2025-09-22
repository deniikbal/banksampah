import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Recycle, Users, Award, TrendingUp, Shield, Menu, X } from 'lucide-react';

export function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  // Handle scroll untuk navbar background
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);

      // Deteksi section yang aktif
      const sections = ['home', 'features', 'benefits', 'cta'];
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 100 && rect.bottom >= 100) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMenuOpen(false);
    }
  };

  const menuItems = [
    { id: 'home', label: 'Beranda', icon: Leaf },
    { id: 'features', label: 'Fitur', icon: Recycle },
    { id: 'benefits', label: 'Manfaat', icon: TrendingUp },
    { id: 'cta', label: 'Mulai', icon: Award },
  ];

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-lg py-2' : 'bg-transparent py-4'
      }`}>
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <Leaf className={`h-8 w-8 ${isScrolled ? 'text-green-600' : 'text-white'}`} />
              <h1 className={`text-2xl font-bold ${isScrolled ? 'text-gray-900' : 'text-white'}`}>
                BankSampah
              </h1>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                      activeSection === item.id
                        ? isScrolled
                          ? 'bg-green-100 text-green-600'
                          : 'bg-white/20 text-white'
                        : isScrolled
                        ? 'text-gray-600 hover:text-green-600'
                        : 'text-white/80 hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
              <div className="flex items-center">
                <Link
                  to="/login"
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Login
                </Link>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`md:hidden p-2 rounded-lg ${
                isScrolled ? 'text-gray-600' : 'text-white'
              }`}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden mt-4 pb-4">
              <div className="bg-white rounded-lg shadow-xl p-4 space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => scrollToSection(item.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                        activeSection === item.id
                          ? 'bg-green-100 text-green-600'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  );
                })}
                <div className="pt-2 border-t border-gray-200">
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full block bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium transition-colors text-center"
                  >
                    Login
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="bg-gradient-to-br from-green-600 to-green-800 text-white pt-32 pb-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-5xl font-bold mb-6">
              Selamat Datang di Bank Sampah Digital
            </h2>
            <p className="text-xl mb-8 text-green-100">
              Sistem manajemen bank sampah modern untuk sekolah. Mengubah sampah menjadi nilai,
              mendidik generasi peduli lingkungan.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
              <Link
                to="/login"
                className="bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors"
              >
                Login
              </Link>
              <button
                onClick={() => scrollToSection('features')}
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-green-600 transition-colors"
              >
                Pelajari Lebih Lanjut
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Mengapa Memilih BankSampah?
            </h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Platform lengkap untuk mengelola bank sampah sekolah dengan sistem transparan dan mudah digunakan
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="bg-green-100 w-16 h-16 rounded-lg flex items-center justify-center mb-6">
                <Recycle className="h-8 w-8 text-green-600" />
              </div>
              <h4 className="text-xl font-semibold mb-4">Sampah Jadi Uang</h4>
              <p className="text-gray-600">
                Sistem penyetoran sampah yang transparan dengan nilai tukar jelas.
                Siswa bisa melihat akumulasi poin dan menariknya menjadi uang.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="bg-blue-100 w-16 h-16 rounded-lg flex items-center justify-center mb-6">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h4 className="text-xl font-semibold mb-4">Manajemen Siswa</h4>
              <p className="text-gray-600">
                Kelola data siswa, kelas, dan pencatatan transaksi dengan mudah.
                Sistem otomatis untuk menghitung akumulasi poin.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="bg-purple-100 w-16 h-16 rounded-lg flex items-center justify-center mb-6">
                <Award className="h-8 w-8 text-purple-600" />
              </div>
              <h4 className="text-xl font-semibold mb-4">Sistem Reward</h4>
              <p className="text-gray-600">
                Motivasi siswa dengan sistem reward dan pencapaian.
                Tracking progress dan penarikan hadiah yang mudah.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-6">
                Manfaat untuk Sekolah Anda
              </h3>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Peningkatan Kesadaran Lingkungan</h4>
                    <p className="text-gray-600">
                      Edukasi praktis tentang pentingnya daur ulang dan pengelolaan sampah
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Shield className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Sistem Transparan</h4>
                    <p className="text-gray-600">
                      Setiap transaksi tercatat dengan jelas dan dapat diakses kapan saja
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <Users className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Keterlibatan Seluruh Sekolah</h4>
                    <p className="text-gray-600">
                      Guru, siswa, dan staf dapat berpartisipasi dalam program ini
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-100 to-blue-100 p-8 rounded-xl">
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">100%</div>
                <p className="text-gray-700 mb-6">Digital dan Paperless</p>
                <ul className="space-y-3 text-left">
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Tidak perlu pencatatan manual</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Laporan real-time</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Akses dari mana saja</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Backup data otomatis</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="cta" className="bg-green-600 py-16">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold text-white mb-4">
            Siap Membangun Sekolah Hijau?
          </h3>
          <p className="text-xl text-green-100 mb-8">
            Bergabunglah dengan sekolah lain yang telah menggunakan sistem bank sampah digital
          </p>
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <Link
              to="/login"
              className="bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors"
            >
              Login
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Leaf className="h-6 w-6 text-green-500" />
              <span className="text-xl font-bold text-white">BankSampah</span>
            </div>
            <div className="text-center md:text-right">
              <p>&copy; 2024 BankSampah. Membangun generasi peduli lingkungan.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}