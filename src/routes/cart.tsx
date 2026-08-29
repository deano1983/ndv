import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ExternalLink, Loader2, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { useEffect } from "react";
import { NdisCheckout } from "@/components/NdisCheckout";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Selection — NDV" },
      { name: "description", content: "Review your sanctuary pieces before checkout." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, isLoading, isSyncing, updateQuantity, removeItem, getCheckoutUrl, syncCart } = useCartStore();
  useEffect(() => { syncCart(); }, [syncCart]);

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => s + parseFloat(i.price.amount) * i.quantity, 0);
  const currency = items[0]?.price.currencyCode || "AUD";

  const handleCheckout = () => {
    const url = getCheckoutUrl();
    if (url) window.open(url, "_blank");
  };

  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <h1 className="font-display text-4xl md:text-5xl gold-grad mb-2">Your Selection</h1>
      <p className="text-sm text-muted-foreground uppercase tracking-widest mb-12">
        {totalItems === 0 ? "Nothing chosen yet" : `${totalItems} item${totalItems !== 1 ? "s" : ""}`}
      </p>

      {items.length === 0 ? (
        <div className="text-center py-24 border hairline rounded-sm">
          <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-40" />
          <p className="text-muted-foreground mb-6">Your sanctuary awaits.</p>
          <Link to="/"><Button variant="outline" className="rounded-sm">Continue browsing</Button></Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-[1fr_320px] gap-12">
          <div className="space-y-6">
            {items.map(item => (
              <div key={item.variantId} className="flex gap-6 pb-6 border-b hairline">
                <div className="w-28 h-28 bg-secondary rounded-sm overflow-hidden flex-shrink-0">
                  {item.product.node.images?.edges?.[0]?.node && (
                    <img src={item.product.node.images.edges[0].node.url} alt={item.product.node.title} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium">{item.product.node.title}</h3>
                  {item.selectedOptions.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">{item.selectedOptions.map(o => o.value).join(" · ")}</p>
                  )}
                  <p className="gold-grad font-medium mt-2">{currency} {parseFloat(item.price.amount).toFixed(2)}</p>
                  <div className="flex items-center gap-2 mt-4">
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.variantId, item.quantity - 1)}><Minus className="h-3 w-3" /></Button>
                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.variantId, item.quantity + 1)}><Plus className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 ml-2 text-muted-foreground" onClick={() => removeItem(item.variantId)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <aside className="md:sticky md:top-24 h-fit border hairline rounded-sm p-6 space-y-5">
            <h2 className="font-display text-2xl gold-grad">Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{currency} {totalPrice.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span className="text-xs text-muted-foreground">Calculated at checkout</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Taxes</span><span className="text-xs text-muted-foreground">Calculated at checkout</span></div>
            </div>
            <div className="flex justify-between items-baseline pt-4 border-t hairline">
              <span className="text-sm uppercase tracking-widest">Total</span>
              <span className="text-2xl font-display gold-grad">{currency} {totalPrice.toFixed(2)}</span>
            </div>
            <NdisCheckout
              lines={items.map(i => ({
                description: i.selectedOptions.length > 0
                  ? `${i.product.node.title} (${i.selectedOptions.map(o => o.value).join(", ")})`
                  : i.product.node.title,
                quantity: i.quantity,
                unitPrice: parseFloat(i.price.amount),
              }))}
              currency={currency}
              onCardDetailsSaved={async (d) => {
                await useCartStore.getState().setNdisAttributes([
                  { key: "NDIS invoice", value: "Yes — self-managed (card + tax invoice)" },
                  { key: "NDIS participant", value: d.participantName },
                  { key: "NDIS number", value: d.ndisNumber },
                  { key: "NDIS contact email", value: d.email },
                ]);
              }}
            />
            <Button onClick={handleCheckout} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-sm" size="lg" disabled={isLoading || isSyncing}>
              {isLoading || isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ExternalLink className="w-4 h-4 mr-2" />Secure Checkout</>}
            </Button>
            <p className="text-[10px] text-muted-foreground text-center uppercase tracking-widest">Encrypted · Shopify Secured</p>
          </aside>
        </div>
      )}
    </div>
  );
}
