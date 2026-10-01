/**
 * DOSA POINT - Interactive Application Logic
 * Supports: Pre-orders, Home Delivery (Min Rs 350 validation), Cart,
 * WhatsApp Order Generation, Dynamic Search/Filters, Tawa Sizzle Simulator & Sound
 */

class DosaApp {
  constructor() {
    this.cart = this.loadCart();
    this.currentCategory = 'all';
    this.currentSubFilter = 'all';
    this.searchQuery = '';
    this.orderMode = 'preorder'; // 'preorder' (Takeaway/Dine-in) or 'delivery'
    this.activeCustomizingItem = null;

    this.initElements();
    this.bindEvents();
    this.checkShopStatus();
    this.renderMenu();
    this.updateCartUI();
  }

  initElements() {
    // Nav & Mode
    this.menuGrid = document.getElementById('menuGrid');
    this.cartDrawerOverlay = document.getElementById('cartDrawerOverlay');
    this.cartDrawer = document.getElementById('cartDrawer');
    this.cartItemsList = document.getElementById('cartItemsList');
    this.cartCountBadges = document.querySelectorAll('.cart-badge');
    this.cartSubtotalEl = document.getElementById('cartSubtotal');
    this.cartGrandTotalEl = document.getElementById('cartGrandTotal');
    this.deliveryFeeLine = document.getElementById('deliveryFeeLine');
    this.deliveryFeeValEl = document.getElementById('deliveryFeeVal');
    this.deliveryNoticeEl = document.getElementById('deliveryNotice');
    this.deliveryProgressBar = document.getElementById('deliveryProgressBar');
    this.deliveryProgressText = document.getElementById('deliveryProgressText');

    // Filter controls
    this.searchInput = document.getElementById('searchInput');
    this.searchClearBtn = document.getElementById('searchClearBtn');
    this.categoryChips = document.querySelectorAll('.category-chip');
    this.subFilterBtns = document.querySelectorAll('.sub-filter-btn');
    this.menuResultsCountEl = document.getElementById('menuResultsCount');

    // Order mode elements
    this.modeBtnPreorder = document.getElementById('modeBtnPreorder');
    this.modeBtnDelivery = document.getElementById('modeBtnDelivery');
    this.modeInfoText = document.getElementById('modeInfoText');
    this.deliveryAddressGroup = document.getElementById('deliveryAddressGroup');
    this.pickupTimeGroup = document.getElementById('pickupTimeGroup');
    this.whatsappOrderBtn = document.getElementById('whatsappOrderBtn');
    this.directOrderBtn = document.getElementById('directOrderBtn');

    // Modals
    this.orderTicketModal = document.getElementById('orderTicketModal');
    this.customizerModal = document.getElementById('customizerModal');
    this.toastContainer = document.getElementById('toastContainer');

    // Tawa interactive elements
    this.tavaEl = document.getElementById('interactiveTava');
    this.crepeEl = document.getElementById('tawaCrepe');
    this.tavaStatusText = document.getElementById('tavaStatusText');
  }

  bindEvents() {
    // Mode toggles
    this.modeBtnPreorder.addEventListener('click', () => this.setOrderMode('preorder'));
    this.modeBtnDelivery.addEventListener('click', () => this.setOrderMode('delivery'));

    // Cart Drawer Open / Close
    document.querySelectorAll('.btn-open-cart').forEach(btn => {
      btn.addEventListener('click', () => this.openCart());
    });
    document.getElementById('btnCloseDrawer').addEventListener('click', () => this.closeCart());
    this.cartDrawerOverlay.addEventListener('click', (e) => {
      if (e.target === this.cartDrawerOverlay) this.closeCart();
    });

    // Search events
    this.searchInput.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.trim().toLowerCase();
      this.searchClearBtn.style.display = this.searchQuery ? 'block' : 'none';
      this.renderMenu();
    });

    this.searchClearBtn.addEventListener('click', () => {
      this.searchInput.value = '';
      this.searchQuery = '';
      this.searchClearBtn.style.display = 'none';
      this.searchInput.focus();
      this.renderMenu();
    });

    // View mode switchers (Cards vs Compact List)
    const viewGridBtn = document.getElementById('viewGridBtn');
    const viewListBtn = document.getElementById('viewListBtn');
    if (viewGridBtn && viewListBtn) {
      viewGridBtn.addEventListener('click', () => {
        this.menuGrid.classList.remove('list-view');
        viewGridBtn.classList.add('active');
        viewListBtn.classList.remove('active');
        sfx.playClick();
      });
      viewListBtn.addEventListener('click', () => {
        this.menuGrid.classList.add('list-view');
        viewListBtn.classList.add('active');
        viewGridBtn.classList.remove('active');
        sfx.playClick();
      });
    }

    // Category chips
    this.categoryChips.forEach(chip => {
      chip.addEventListener('click', () => {
        this.categoryChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.currentCategory = chip.dataset.category;
        sfx.playClick();
        this.renderMenu();
      });
    });

    // Sub-filters
    this.subFilterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.classList.contains('active')) {
          btn.classList.remove('active');
          this.currentSubFilter = 'all';
        } else {
          this.subFilterBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.currentSubFilter = btn.dataset.subfilter;
        }
        sfx.playClick();
        this.renderMenu();
      });
    });

    // Sound toggle
    const audioToggleBtn = document.getElementById('audioToggleBtn');
    if (audioToggleBtn) {
      audioToggleBtn.addEventListener('click', () => {
        sfx.isMuted = !sfx.isMuted;
        audioToggleBtn.innerHTML = sfx.isMuted ? '🔇' : '🔊';
        audioToggleBtn.title = sfx.isMuted ? 'Unmute Sound' : 'Mute Sound';
        this.showToast(sfx.isMuted ? 'Sound muted' : 'Sound enabled');
      });
    }

    // Checkout actions
    this.whatsappOrderBtn.addEventListener('click', () => this.handleCheckoutWhatsApp());
    this.directOrderBtn.addEventListener('click', () => this.handleCheckoutDirect());

    // Close Ticket Modal
    document.getElementById('btnCloseTicket').addEventListener('click', () => {
      this.orderTicketModal.classList.remove('active');
    });

    // Interactive Tawa Sizzle controls
    this.bindTawaControls();
  }

  // Check shop timings
  checkShopStatus() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentTimeInMins = hours * 60 + minutes;

    // 09:00 AM = 540 mins, 09:30 PM = 21:30 = 1290 mins
    const isOpen = currentTimeInMins >= 540 && currentTimeInMins <= 1290;
    const statusPill = document.getElementById('shopLiveStatusPill');

    if (statusPill) {
      if (isOpen) {
        statusPill.innerHTML = `<span class="pulse-dot"></span> Open Now (09:00 AM - 09:30 PM)`;
        statusPill.className = "status-badge open";
      } else {
        statusPill.innerHTML = `🌙 Currently Closed (Opens 9:00 AM) • Pre-order Accepted`;
        statusPill.className = "status-badge closed";
      }
    }
  }

  // Switch Order Mode
  setOrderMode(mode) {
    this.orderMode = mode;
    sfx.playClick();

    if (mode === 'delivery') {
      this.modeBtnDelivery.classList.add('active');
      this.modeBtnPreorder.classList.remove('active');
      this.modeInfoText.innerHTML = `🛵 <strong>Home Delivery</strong>: Min. order ₹350 • Drop your location on WhatsApp for fast dispatch!`;
      this.deliveryAddressGroup.style.display = 'block';
      this.pickupTimeGroup.style.display = 'none';
      this.deliveryFeeLine.style.display = 'flex';
    } else {
      this.modeBtnPreorder.classList.add('active');
      this.modeBtnDelivery.classList.remove('active');
      this.modeInfoText.innerHTML = `🛍️ <strong>Pre-Order (Takeaway / Dine-in)</strong>: Beat the rush! Freshly made upon your arrival. No minimum.`;
      this.deliveryAddressGroup.style.display = 'none';
      this.pickupTimeGroup.style.display = 'block';
      this.deliveryFeeLine.style.display = 'none';
    }

    this.updateCartUI();
  }

  // Filter & Render Menu Cards
  renderMenu() {
    const filtered = MENU_ITEMS.filter(item => {
      // Category Match
      const matchesCat = (this.currentCategory === 'all') || (item.category === this.currentCategory);

      // Search Match
      const matchesSearch = !this.searchQuery || 
        item.name.toLowerCase().includes(this.searchQuery) ||
        item.description.toLowerCase().includes(this.searchQuery) ||
        item.tags.some(t => t.toLowerCase().includes(this.searchQuery)) ||
        item.categoryName.toLowerCase().includes(this.searchQuery);

      // Sub-filter Match
      let matchesSub = true;
      if (this.currentSubFilter === 'bestseller') matchesSub = item.isBestseller;
      if (this.currentSubFilter === 'chef') matchesSub = item.isChefSpecial;
      if (this.currentSubFilter === 'spicy') matchesSub = item.spiceLevel === 'Spicy';
      if (this.currentSubFilter === 'ghee') matchesSub = item.name.toLowerCase().includes('ghee') || item.name.toLowerCase().includes('butter');
      if (this.currentSubFilter === 'paneer') matchesSub = item.name.toLowerCase().includes('paneer');

      return matchesCat && matchesSearch && matchesSub;
    });

    this.menuResultsCountEl.textContent = `Showing ${filtered.length} of ${MENU_ITEMS.length} South Indian delicacies`;

    if (filtered.length === 0) {
      this.menuGrid.innerHTML = `
        <div class="empty-menu-state">
          <h4>No items matched your craving</h4>
          <p>Try searching for "Masala Dosa", "Uttapam", "Ghee", or "Idly".</p>
          <button class="btn-tawa-sizzle" style="margin-top: 14px;" onclick="app.resetFilters()">View All 22 Menu Items</button>
        </div>
      `;
      return;
    }

    this.menuGrid.innerHTML = filtered.map(item => {
      const inCartQty = this.getItemQuantity(item.id);

      return `
        <div class="menu-card" data-id="${item.id}">
          <div class="card-img-wrap">
            <img src="${item.image}" alt="${item.name}" loading="lazy">
            <div class="card-badges-top">
              <div class="veg-symbol" title="100% Pure Vegetarian">
                <div class="veg-dot"></div>
              </div>
              <div>
                ${item.isChefSpecial ? `<span class="card-badge-pill badge-chef">Chef's Special ⭐</span>` : ''}
                ${item.isBestseller && !item.isChefSpecial ? `<span class="card-badge-pill badge-bestseller">Bestseller 🔥</span>` : ''}
              </div>
            </div>
            <div class="card-rating-float">
              ★ ${item.rating} <span style="opacity: 0.7; font-size: 0.65rem;">(${item.reviewsCount})</span>
            </div>
          </div>

          <div class="card-body">
            <div class="card-header-line">
              <h3 class="card-title">${item.name}</h3>
              <div class="card-price">₹${item.price}</div>
            </div>
            <div class="card-category-sub">${item.categoryName}</div>
            <p class="card-desc">${item.description}</p>
            
            <div class="card-tags">
              ${item.tags.map(t => `<span class="item-tag">${t}</span>`).join('')}
            </div>

            <div class="card-footer">
              ${inCartQty === 0 ? `
                <button class="btn-add-item" onclick="app.addItemToCart(${item.id})">
                  <span>+</span> Add to Pre-Order
                </button>
              ` : `
                <div class="quantity-controller">
                  <button class="qty-btn" onclick="app.updateItemQty(${item.id}, -1)">−</button>
                  <span class="qty-number">${inCartQty}</span>
                  <button class="qty-btn" onclick="app.updateItemQty(${item.id}, 1)">+</button>
                </div>
              `}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  resetFilters() {
    this.searchQuery = '';
    this.searchInput.value = '';
    this.searchClearBtn.style.display = 'none';
    this.currentCategory = 'all';
    this.currentSubFilter = 'all';
    this.categoryChips.forEach(c => c.classList.toggle('active', c.dataset.category === 'all'));
    this.subFilterBtns.forEach(b => b.classList.remove('active'));
    this.renderMenu();
  }

  // Cart Operations
  addItemToCart(itemId, customNote = '') {
    const item = MENU_ITEMS.find(i => i.id === itemId);
    if (!item) return;

    const existing = this.cart.find(c => c.id === itemId && c.note === customNote);
    if (existing) {
      existing.quantity += 1;
    } else {
      this.cart.push({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        note: customNote,
        category: item.category
      });
    }

    sfx.playAddChime();
    this.saveCart();
    this.renderMenu();
    this.updateCartUI();
    this.showToast(`Added "${item.name}" to order! 🥟`);
  }

  updateItemQty(itemId, change) {
    const index = this.cart.findIndex(c => c.id === itemId);
    if (index === -1) return;

    this.cart[index].quantity += change;
    if (this.cart[index].quantity <= 0) {
      const removedName = this.cart[index].name;
      this.cart.splice(index, 1);
      this.showToast(`Removed "${removedName}"`);
    } else {
      sfx.playClick();
    }

    this.saveCart();
    this.renderMenu();
    this.updateCartUI();
  }

  getItemQuantity(itemId) {
    return this.cart
      .filter(c => c.id === itemId)
      .reduce((sum, c) => sum + c.quantity, 0);
  }

  getCartSubtotal() {
    return this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  getCartTotalCount() {
    return this.cart.reduce((sum, item) => sum + item.quantity, 0);
  }

  updateCartUI() {
    const totalCount = this.getCartTotalCount();
    const subtotal = this.getCartSubtotal();

    // Update Badges
    this.cartCountBadges.forEach(badge => {
      badge.textContent = totalCount;
      badge.style.display = totalCount > 0 ? 'flex' : 'none';
    });

    // Update Mobile Bottom Bar
    const mobileCartBar = document.getElementById('mobileBottomCartBar');
    const mobileCartTotal = document.getElementById('mobileCartTotal');
    const mobileCartCount = document.getElementById('mobileCartCount');
    if (mobileCartBar && mobileCartTotal && mobileCartCount) {
      if (totalCount > 0) {
        mobileCartBar.style.display = 'block';
        mobileCartTotal.textContent = `₹${subtotal}`;
        mobileCartCount.textContent = `${totalCount} item${totalCount > 1 ? 's' : ''}`;
      } else {
        mobileCartBar.style.display = 'none';
      }
    }

    // Render Cart Drawer list
    if (this.cart.length === 0) {
      this.cartItemsList.innerHTML = `
        <div class="cart-empty-message">
          <div class="icon">🥣</div>
          <h4>Your plate is empty!</h4>
          <p>Select delicious crisp dosas or uttapams to start your pre-order.</p>
        </div>
      `;
      this.deliveryNoticeEl.style.display = 'none';
    } else {
      this.cartItemsList.innerHTML = this.cart.map(item => `
        <div class="cart-item-row">
          <div class="cart-item-info">
            <strong>${item.name}</strong>
            <span class="item-unit-price">₹${item.price} each</span>
            ${item.note ? `<div class="item-custom-notes">Note: ${item.note}</div>` : ''}
          </div>
          <div class="cart-item-controls">
            <div class="mini-qty-box">
              <button class="mini-qty-btn" onclick="app.updateItemQty(${item.id}, -1)">−</button>
              <span class="mini-qty-count">${item.quantity}</span>
              <button class="mini-qty-btn" onclick="app.updateItemQty(${item.id}, 1)">+</button>
            </div>
            <div class="cart-item-subtotal">₹${item.price * item.quantity}</div>
          </div>
        </div>
      `).join('');
    }

    // Delivery Minimum Calculation (Rs. 350 requirement)
    let deliveryFee = 0;
    const minDelivery = SHOP_CONFIG.minDeliveryAmount;

    if (this.orderMode === 'delivery') {
      this.deliveryNoticeEl.style.display = 'block';
      if (subtotal < minDelivery) {
        const diff = minDelivery - subtotal;
        const percent = Math.min(100, Math.round((subtotal / minDelivery) * 100));
        this.deliveryNoticeEl.className = 'delivery-min-notice danger';
        this.deliveryProgressText.innerHTML = `⚠️ Add <strong>₹${diff}</strong> more to meet the <strong>₹${minDelivery} Minimum Delivery Order</strong>!`;
        this.deliveryProgressBar.style.width = `${percent}%`;
        this.whatsappOrderBtn.disabled = true;
        this.whatsappOrderBtn.style.opacity = '0.5';
        this.directOrderBtn.disabled = true;
        this.directOrderBtn.style.opacity = '0.5';
      } else {
        this.deliveryNoticeEl.className = 'delivery-min-notice';
        this.deliveryProgressText.innerHTML = `✅ Minimum order met! Delivering hot to Netaji Nagar Market & nearby.`;
        this.deliveryProgressBar.style.width = '100%';
        this.whatsappOrderBtn.disabled = false;
        this.whatsappOrderBtn.style.opacity = '1';
        this.directOrderBtn.disabled = false;
        this.directOrderBtn.style.opacity = '1';
      }

      // Delivery fee
      deliveryFee = subtotal >= SHOP_CONFIG.freeDeliveryThreshold ? 0 : SHOP_CONFIG.deliveryFee;
      this.deliveryFeeValEl.textContent = deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`;
    } else {
      // Pre-order pickup has no minimum
      this.deliveryNoticeEl.style.display = 'none';
      this.whatsappOrderBtn.disabled = subtotal === 0;
      this.whatsappOrderBtn.style.opacity = subtotal === 0 ? '0.5' : '1';
      this.directOrderBtn.disabled = subtotal === 0;
      this.directOrderBtn.style.opacity = subtotal === 0 ? '0.5' : '1';
      deliveryFee = 0;
    }

    const grandTotal = subtotal + deliveryFee;
    this.cartSubtotalEl.textContent = `₹${subtotal}`;
    this.cartGrandTotalEl.textContent = `₹${grandTotal}`;
  }

  openCart() {
    this.cartDrawerOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  closeCart() {
    this.cartDrawerOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  // Checkout via WhatsApp (7290995566 as listed on PDF)
  handleCheckoutWhatsApp() {
    if (this.cart.length === 0) {
      alert("Please add items to your cart first!");
      return;
    }

    const subtotal = this.getCartSubtotal();
    if (this.orderMode === 'delivery' && subtotal < SHOP_CONFIG.minDeliveryAmount) {
      alert(`For Home Delivery, minimum order amount is ₹${SHOP_CONFIG.minDeliveryAmount}. Please add more items.`);
      return;
    }

    const customerName = document.getElementById('custName').value.trim() || 'Customer';
    const customerPhone = document.getElementById('custPhone').value.trim() || '';
    const customerNotes = document.getElementById('custNotes').value.trim();

    let orderDetailsText = '';
    this.cart.forEach((item, index) => {
      orderDetailsText += `${index + 1}. *${item.name}* x ${item.quantity} = ₹${item.price * item.quantity}\n`;
      if (item.note) orderDetailsText += `   _(Note: ${item.note})_\n`;
    });

    let fulfillmentInfo = '';
    if (this.orderMode === 'delivery') {
      const address = document.getElementById('custAddress').value.trim() || 'Address not entered';
      fulfillmentInfo = `*Mode:* 🛵 HOME DELIVERY\n*Delivery Address:* ${address}\n📍 *Note:* Sending live location now.`;
    } else {
      const pickupTime = document.getElementById('pickupTimeSelect').value;
      fulfillmentInfo = `*Mode:* 🛍️ PRE-ORDER (Takeaway / Dine-in)\n*Expected Arrival Time:* ${pickupTime}`;
    }

    const deliveryFee = this.orderMode === 'delivery' ? (subtotal >= SHOP_CONFIG.freeDeliveryThreshold ? 0 : SHOP_CONFIG.deliveryFee) : 0;
    const grandTotal = subtotal + deliveryFee;

    // Compose formatted WhatsApp text
    const message = 
`🙏 *Namaste Dosa Point! New Pre-Order Request*
---------------------------------------
👤 *Customer Name:* ${customerName}
📞 *Contact Number:* ${customerPhone || 'Shared on WhatsApp'}
${fulfillmentInfo}
${customerNotes ? `📝 *Special Instructions:* ${customerNotes}\n` : ''}
---------------------------------------
🍽️ *ORDER ITEMS:*
${orderDetailsText}
---------------------------------------
Subtotal: ₹${subtotal}
${this.orderMode === 'delivery' ? `Delivery Fee: ${deliveryFee === 0 ? 'FREE' : '₹' + deliveryFee}\n` : ''}*Grand Total:* ₹${grandTotal}
---------------------------------------
_Sent via Dosa Point Online Pre-Order Menu_
_Shop 69, Netaji Nagar Market_`;

    const encodedMsg = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${SHOP_CONFIG.whatsappNumber}?text=${encodedMsg}`;

    sfx.playOrderSuccess();
    window.open(whatsappUrl, '_blank');
    this.showConfirmationTicket(customerName, grandTotal);
  }

  // Direct In-App Simulated Order Placement
  handleCheckoutDirect() {
    if (this.cart.length === 0) return;
    const subtotal = this.getCartSubtotal();
    if (this.orderMode === 'delivery' && subtotal < SHOP_CONFIG.minDeliveryAmount) {
      alert(`For Home Delivery, minimum order amount is ₹${SHOP_CONFIG.minDeliveryAmount}.`);
      return;
    }

    const customerName = document.getElementById('custName').value.trim() || 'Guest Foodie';
    const deliveryFee = this.orderMode === 'delivery' ? (subtotal >= SHOP_CONFIG.freeDeliveryThreshold ? 0 : SHOP_CONFIG.deliveryFee) : 0;
    const grandTotal = subtotal + deliveryFee;

    sfx.playOrderSuccess();
    this.showConfirmationTicket(customerName, grandTotal);
  }

  showConfirmationTicket(customerName, total) {
    const tokenNum = `DP-${Math.floor(1000 + Math.random() * 9000)}`;
    document.getElementById('ticketTokenNum').textContent = `Order Token #${tokenNum}`;
    document.getElementById('ticketCustomerName').textContent = customerName;
    document.getElementById('ticketTotalAmount').textContent = `₹${total}`;
    document.getElementById('ticketOrderMode').textContent = this.orderMode === 'delivery' ? 'Home Delivery (Shop 69)' : 'Pre-Order Pickup';

    const itemsSummary = this.cart.map(c => `${c.quantity}x ${c.name}`).join(', ');
    document.getElementById('ticketItemsList').textContent = itemsSummary;

    this.closeCart();
    this.orderTicketModal.classList.add('active');

    // Simulate Live Tawa Preparation tracker steps
    this.animateOrderTimeline();

    // Clear cart after placing order
    this.cart = [];
    this.saveCart();
    this.renderMenu();
    this.updateCartUI();
  }

  animateOrderTimeline() {
    const steps = [
      document.getElementById('step1'),
      document.getElementById('step2'),
      document.getElementById('step3'),
      document.getElementById('step4')
    ];

    steps.forEach((s, idx) => {
      s.classList.remove('completed', 'active');
      if (idx === 0) s.classList.add('completed');
    });

    setTimeout(() => {
      if (steps[1]) {
        steps[1].classList.add('active');
        sfx.startTawaSizzle(2);
      }
    }, 2500);

    setTimeout(() => {
      if (steps[1]) steps[1].classList.add('completed');
      if (steps[2]) steps[2].classList.add('active');
    }, 6000);
  }

  // Interactive South Indian Tawa Sizzle Live Stage Widget
  bindTawaControls() {
    const btnPour = document.getElementById('btnTawaPour');
    const btnMasala = document.getElementById('btnTawaMasala');
    const btnGhee = document.getElementById('btnTawaGhee');
    const btnCrisp = document.getElementById('btnTawaCrisp');

    if (this.tavaEl) {
      this.tavaEl.addEventListener('click', () => {
        this.triggerSizzleSequence();
      });
    }

    if (btnPour) {
      btnPour.addEventListener('click', () => {
        sfx.playClick();
        this.crepeEl.style.transform = 'scale(0.8)';
        this.crepeEl.style.background = '#fef08a';
        this.tavaStatusText.textContent = 'Fermented rice & urad dal batter swirled in golden concentric circles!';
      });
    }

    if (btnMasala) {
      btnMasala.addEventListener('click', () => {
        sfx.playClick();
        const core = document.querySelector('.tawa-masala-core');
        if (core) core.style.transform = 'scale(1.3)';
        this.tavaStatusText.textContent = 'Spiced turmeric potato mash & roasted onions added to the center!';
      });
    }

    if (btnGhee) {
      btnGhee.addEventListener('click', () => {
        sfx.startTawaSizzle(3);
        this.crepeEl.classList.add('sizzling');
        this.tavaStatusText.textContent = 'Sizzling pure desi ghee drizzled around the edges for that legendary crunch!';
        setTimeout(() => this.crepeEl.classList.remove('sizzling'), 3000);
      });
    }

    if (btnCrisp) {
      btnCrisp.addEventListener('click', () => {
        this.triggerSizzleSequence();
      });
    }

    // Hero trigger button
    const heroSizzleBtn = document.getElementById('heroSizzleBtn');
    if (heroSizzleBtn) {
      heroSizzleBtn.addEventListener('click', () => {
        const section = document.getElementById('tawaStageSection');
        if (section) {
          section.scrollIntoView({ behavior: 'smooth' });
          setTimeout(() => this.triggerSizzleSequence(), 600);
        }
      });
    }
  }

  triggerSizzleSequence() {
    sfx.startTawaSizzle(3.5);
    this.crepeEl.classList.add('sizzling');
    this.crepeEl.style.background = 'radial-gradient(circle, #fde047 20%, #f59e0b 60%, #b45309 100%)';
    this.tavaStatusText.textContent = '🔥 Fresh hot dosa sizzling on cast iron tawa! Golden brown, fragrant & ready to fold!';

    this.showToast('🔥 Hear the authentic tawa sizzle!');

    setTimeout(() => {
      this.crepeEl.classList.remove('sizzling');
    }, 3500);
  }

  // Toast Helper
  showToast(message) {
    if (!this.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>🥢</span> ${message}`;
    this.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  // LocalStorage Persistence
  saveCart() {
    try {
      localStorage.setItem('dosapoint_cart', JSON.stringify(this.cart));
    } catch (e) {}
  }

  loadCart() {
    try {
      const data = localStorage.getItem('dosapoint_cart');
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }
}

// Global instance initialization on DOM ready
let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new DosaApp();
});
