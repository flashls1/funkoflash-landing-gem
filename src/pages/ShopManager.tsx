import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Upload, X, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  square_checkout_url: string;
  autoplay_interval: number;
  image_urls: string[];
  active: boolean;
}

interface ProductFormData {
  title: string;
  description: string;
  price: string;
  square_checkout_url: string;
  autoplay_interval: number;
}

const ShopManager = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>({
    title: '',
    description: '',
    price: '',
    square_checkout_url: '',
    autoplay_interval: 3
  });
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user || (profile && !['admin', 'staff'].includes(profile.role))) {
      navigate('/auth');
      return;
    }
  }, [user, profile, navigate]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('shop_products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts((data || []).map(product => ({
        ...product,
        image_urls: Array.isArray(product.image_urls) ? 
          product.image_urls.filter(url => typeof url === 'string') as string[] : 
          []
      })));
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (files: FileList) => {
    if (!files.length) return;
    
    const maxImages = 6;
    const maxSize = 50 * 1024 * 1024; // 50MB
    
    if (uploadedImages.length + files.length > maxImages) {
      toast({
        title: "Too many images",
        description: `Maximum ${maxImages} images allowed per product`,
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    const newImageUrls: string[] = [];

    try {
      for (const file of Array.from(files)) {
        if (file.size > maxSize) {
          toast({
            title: "File too large",
            description: `${file.name} exceeds 50MB limit`,
            variant: "destructive"
          });
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        newImageUrls.push(publicUrl);
      }

      setUploadedImages(prev => [...prev, ...newImageUrls]);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload one or more images",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (indexToRemove: number) => {
    setUploadedImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return false;
    }
    if (!formData.description.trim()) {
      toast({ title: "Description is required", variant: "destructive" });
      return false;
    }
    if (!formData.price || isNaN(parseFloat(formData.price))) {
      toast({ title: "Valid price is required", variant: "destructive" });
      return false;
    }
    if (!formData.square_checkout_url.trim() || !isValidUrl(formData.square_checkout_url)) {
      toast({ title: "Valid Square checkout URL is required", variant: "destructive" });
      return false;
    }
    return true;
  };

  const isValidUrl = (string: string): boolean => {
    try {
      new URL(string);
      return true;
    } catch {
      return false;
    }
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      const productData = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        square_checkout_url: formData.square_checkout_url,
        autoplay_interval: formData.autoplay_interval,
        image_urls: uploadedImages,
        active: true
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('shop_products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
        toast({ title: "Product updated successfully" });
      } else {
        const { error } = await supabase
          .from('shop_products')
          .insert([productData]);

        if (error) throw error;
        toast({ title: "Product created successfully" });
      }

      resetForm();
      fetchProducts();
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Save failed",
        description: "Failed to save product",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      title: product.title,
      description: product.description,
      price: product.price.toString(),
      square_checkout_url: product.square_checkout_url,
      autoplay_interval: product.autoplay_interval
    });
    setUploadedImages(product.image_urls);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase
        .from('shop_products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Product deleted successfully" });
      fetchProducts();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Delete failed",
        description: "Failed to delete product",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      price: '',
      square_checkout_url: '',
      autoplay_interval: 3
    });
    setUploadedImages([]);
    setEditingProduct(null);
    setShowForm(false);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  if (!user || (profile && !['admin', 'staff'].includes(profile.role))) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation language={language} setLanguage={setLanguage} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Shop Manager</h1>
            <p className="text-muted-foreground">Manage products and inventory</p>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>

        <Tabs defaultValue="products" className="space-y-6">
          <TabsList>
            <TabsTrigger value="products">Products</TabsTrigger>
            {showForm && <TabsTrigger value="form">Product Form</TabsTrigger>}
          </TabsList>

          <TabsContent value="products">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-48 bg-muted" />
                    <CardContent className="p-4">
                      <div className="h-4 bg-muted rounded mb-2" />
                      <div className="h-3 bg-muted rounded mb-4" />
                      <div className="h-8 bg-muted rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16">
                <h2 className="text-2xl font-semibold mb-2">No products yet</h2>
                <p className="text-muted-foreground mb-4">Create your first product to get started</p>
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <Card key={product.id} className="overflow-hidden">
                    {product.image_urls.length > 0 ? (
                      <div className="h-48 overflow-hidden">
                        <img
                          src={product.image_urls[0]}
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-48 bg-muted flex items-center justify-center">
                        <span className="text-4xl">📦</span>
                      </div>
                    )}
                    
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold line-clamp-1">{product.title}</h3>
                        <Badge variant={product.active ? "default" : "secondary"}>
                          {product.active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {product.description}
                      </p>
                      
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-medium">{formatPrice(product.price)}</span>
                        <span className="text-sm text-muted-foreground">
                          {product.image_urls.length} images
                        </span>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(product)}>
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(product.id)}>
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {showForm && (
            <TabsContent value="form">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>
                      {editingProduct ? 'Edit Product' : 'Add New Product'}
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={resetForm}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Product Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter product title"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="price">Price (USD) *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter product description"
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="checkout_url">Square Checkout URL *</Label>
                    <Input
                      id="checkout_url"
                      value={formData.square_checkout_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, square_checkout_url: e.target.value }))}
                      placeholder="https://checkout.square.site/..."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Slideshow Autoplay Speed: {formData.autoplay_interval}s</Label>
                    <Slider
                      value={[formData.autoplay_interval]}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, autoplay_interval: value[0] }))}
                      max={5}
                      min={0}
                      step={0.5}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label>Product Images (max 6, 50MB each)</Label>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading || uploadedImages.length >= 6}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {uploading ? 'Uploading...' : 'Upload Images'}
                      </Button>
                    </div>
                    
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                      multiple
                      accept="image/*"
                      className="hidden"
                    />
                    
                    {uploadedImages.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {uploadedImages.map((url, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={url}
                              alt={`Product image ${index + 1}`}
                              className="w-full h-32 object-cover rounded border"
                            />
                            <Button
                              size="sm"
                              variant="destructive"
                              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeImage(index)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-4">
                    <Button onClick={handleSave} className="flex-1">
                      <Save className="w-4 h-4 mr-2" />
                      {editingProduct ? 'Update Product' : 'Create Product'}
                    </Button>
                    <Button variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </main>
      
      <Footer language={language} />
    </div>
  );
};

export default ShopManager;