/* ============================================================
   CONFIGURAZIONE - modifica solo questa parte
   ============================================================ */
var CONFIG = {
  // Contatti per ricevere gli ordini (lascia "" per nascondere il pulsante)
  whatsapp: "393895211047",          // numero con prefisso, senza + e senza spazi (es. 393331234567)
  email: "accollinare@gmail.com",        // email che riceve gli ordini

  // Costo extra per la personalizzazione (nome + numero), per ogni maglia
  prezzoPersonalizzazione: 5,

  // Metodi di pagamento selezionabili dal cliente
  pagamenti: [
    { id: "Contanti", nome: "Contanti", info: "Alla consegna/ritiro" },
    { id: "Bonifico", nome: "Bonifico", info: "Ti inviamo l'IBAN dopo la conferma" },
    { id: "Satispay", nome: "Satispay", info: "Ti inviamo la richiesta dopo la conferma" }
  ],

  // Prodotti. "foto": percorso immagine (es. "img/maglia-home.jpg"); se vuoto mostra una sagoma.
  prodotti: [
    {
      id: "home", nome: "Maglia Home", prezzo: 30,
      taglie: ["S", "M", "L", "XL", "XXL"],
      personalizzabile: true, foto: "img/maglia-home.jpeg",
      colori: { corpo: "#ffd400", dettagli: "#121212" }
    },
    {
      id: "away", nome: "Maglia Away", prezzo: 30,
      taglie: ["S", "M", "L", "XL", "XXL"],
      personalizzabile: true, foto: "img/maglia-away.jpeg",
      colori: { corpo: "#121212", dettagli: "#ffd400" }
    },
    {
      id: "felpa", nome: "Felpa", prezzo: 40,
      taglie: ["S", "M", "L", "XL", "XXL"],
      personalizzabile: false, foto: "img/felpa.jpeg",
      colori: { corpo: "#2a2a2a", dettagli: "#ffd400" }, tipo: "felpa"
    }
  ]
};
/* ============================================================ */

(function () {
  "use strict";

  var STORAGE_KEY = "collinare-cart-v1";
  var cart = load();
  var payment = CONFIG.pagamenti[0].id;

  var $ = function (s) { return document.querySelector(s); };
  var euro = function (n) { return "€" + n.toFixed(2).replace(".", ","); };
  var esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };

  function load() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch (e) { return []; }
  }
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); } catch (e) { /* ignora */ }
  }

  function findProduct(id) {
    return CONFIG.prodotti.filter(function (p) { return p.id === id; })[0];
  }
  function unitPrice(item) {
    var p = findProduct(item.id);
    return p ? p.prezzo + (item.pers ? CONFIG.prezzoPersonalizzazione : 0) : 0;
  }

  /* ---------- Sagoma segnaposto ---------- */
  function placeholder(p) {
    var c = p.colori;
    if (p.tipo === "felpa") {
      return '<svg viewBox="0 0 200 180" role="img" aria-label="' + esc(p.nome) + '">' +
        '<path d="M70 14 L40 28 L6 100 L34 114 L50 84 L50 168 H150 V84 L166 114 L194 100 L160 28 L130 14 Q100 40 70 14Z" fill="' + c.corpo + '"/>' +
        '<path d="M70 14 Q100 40 130 14 L124 10 Q100 28 76 10Z" fill="' + c.dettagli + '"/>' +
        '<rect x="66" y="112" width="68" height="30" rx="6" fill="' + c.dettagli + '" opacity=".25"/>' +
        '<rect x="50" y="160" width="100" height="8" fill="' + c.dettagli + '"/></svg>';
    }
    return '<svg viewBox="0 0 200 180" role="img" aria-label="' + esc(p.nome) + '">' +
      '<path d="M72 12 L34 28 L6 76 L36 92 L50 70 L50 168 H150 V70 L164 92 L194 76 L166 28 L128 12 Q100 38 72 12Z" fill="' + c.corpo + '"/>' +
      '<path d="M72 12 Q100 38 128 12 L122 8 Q100 26 78 8Z" fill="' + c.dettagli + '"/>' +
      '<path d="M6 76 L36 92 L42 82 L14 66Z M194 76 L164 92 L158 82 L186 66Z" fill="' + c.dettagli + '"/></svg>';
  }

  /* ---------- Catalogo ---------- */
  function renderProducts() {
    $("#products").innerHTML = CONFIG.prodotti.map(function (p) {
      var media = p.foto
        ? '<img src="' + esc(p.foto) + '" alt="' + esc(p.nome) + '" loading="lazy" />'
        : placeholder(p);
      var sizes = p.taglie.map(function (t, i) {
        var id = p.id + "-t-" + t;
        return '<input type="radio" name="size-' + p.id + '" id="' + id + '" value="' + esc(t) + '"' + (i === 2 ? "" : "") + ' />' +
               '<label for="' + id + '">' + esc(t) + '</label>';
      }).join("");
      var custom = p.personalizzabile
        ? '<div class="custom">' +
            '<label class="check"><input type="checkbox" class="pers-toggle" /> Personalizza con nome e numero <em>(+' + euro(CONFIG.prezzoPersonalizzazione) + ')</em></label>' +
            '<div class="custom-fields" hidden>' +
              '<input type="text" class="pers-nome" placeholder="Nome" maxlength="14" aria-label="Nome da stampare" />' +
              '<input type="number" class="pers-num" placeholder="N." min="0" max="99" inputmode="numeric" aria-label="Numero da stampare" />' +
            '</div>' +
          '</div>'
        : "";
      return '<article class="card" data-id="' + p.id + '">' +
        '<div class="media">' + media + '</div>' +
        '<div class="card-body">' +
          '<h2>' + esc(p.nome) + '</h2>' +
          '<div class="price">' + euro(p.prezzo) + '</div>' +
          '<div><span class="lbl">Taglia</span><div class="sizes">' + sizes + '</div></div>' +
          custom +
          '<p class="field-err" role="alert"></p>' +
          '<div class="add-row">' +
            '<div class="qty"><button type="button" class="q-minus" aria-label="Diminuisci">&minus;</button><span class="q-val">1</span><button type="button" class="q-plus" aria-label="Aumenta">+</button></div>' +
            '<button type="button" class="btn btn-main add">Aggiungi al carrello</button>' +
          '</div>' +
        '</div></article>';
    }).join("");
  }

  function onProductsClick(e) {
    var card = e.target.closest(".card");
    if (!card) return;
    var qv = card.querySelector(".q-val");
    if (e.target.closest(".q-plus")) qv.textContent = Math.min(20, +qv.textContent + 1);
    if (e.target.closest(".q-minus")) qv.textContent = Math.max(1, +qv.textContent - 1);
    if (e.target.closest(".add")) addFromCard(card);
  }

  function onProductsChange(e) {
    if (!e.target.classList.contains("pers-toggle")) return;
    var box = e.target.closest(".custom").querySelector(".custom-fields");
    box.hidden = !e.target.checked;
    if (e.target.checked) box.querySelector(".pers-nome").focus();
  }

  function addFromCard(card) {
    var p = findProduct(card.getAttribute("data-id"));
    var err = card.querySelector(".field-err");
    var sel = card.querySelector('input[name="size-' + p.id + '"]:checked');
    var tog = card.querySelector(".pers-toggle");
    var pers = !!(tog && tog.checked);
    var nome = pers ? card.querySelector(".pers-nome").value.trim() : "";
    var num = pers ? card.querySelector(".pers-num").value.trim() : "";

    err.textContent = "";
    if (!sel) { err.textContent = "Seleziona una taglia."; return; }
    if (pers && !nome && num === "") { err.textContent = "Inserisci nome e/o numero, oppure togli la personalizzazione."; return; }
    if (pers && num !== "" && (isNaN(+num) || +num < 0 || +num > 99)) { err.textContent = "Il numero deve essere tra 0 e 99."; return; }

    var item = {
      id: p.id, taglia: sel.value, pers: pers,
      nome: nome.toUpperCase(), num: num,
      qty: +card.querySelector(".q-val").textContent
    };
    var same = cart.filter(function (c) {
      return c.id === item.id && c.taglia === item.taglia && c.pers === item.pers && c.nome === item.nome && c.num === item.num;
    })[0];
    if (same) same.qty = Math.min(20, same.qty + item.qty); else cart.push(item);

    save(); renderCart();
    card.querySelector(".q-val").textContent = "1";
    toast(p.nome + " aggiunta al carrello");
  }

  /* ---------- Carrello ---------- */
  function total() {
    return cart.reduce(function (s, i) { return s + unitPrice(i) * i.qty; }, 0);
  }

  function renderCart() {
    cart = cart.filter(function (i) { return findProduct(i.id); });
    var count = cart.reduce(function (s, i) { return s + i.qty; }, 0);
    $("#cart-count").textContent = count;
    $("#cart-empty").hidden = cart.length > 0;
    $("#order-form").hidden = cart.length === 0;
    $("#total").textContent = euro(total());

    $("#cart-list").innerHTML = cart.map(function (i, idx) {
      var p = findProduct(i.id);
      var meta = "Taglia " + esc(i.taglia);
      if (i.pers) meta += " &middot; Stampa: " + esc([i.nome, i.num].filter(Boolean).join(" ")) ;
      return '<li class="cart-item" data-idx="' + idx + '">' +
        '<strong>' + esc(p.nome) + '</strong>' +
        '<span class="line-total">' + euro(unitPrice(i) * i.qty) + '</span>' +
        '<span class="meta">' + meta + '</span>' +
        '<div class="ctrl"><div class="qty"><button type="button" data-a="minus" aria-label="Diminuisci">&minus;</button><span>' + i.qty + '</span><button type="button" data-a="plus" aria-label="Aumenta">+</button></div>' +
        '<button type="button" class="link-btn" data-a="remove">Rimuovi</button></div></li>';
    }).join("");

    renderSendButtons();
  }

  function onCartClick(e) {
    var btn = e.target.closest("[data-a]");
    if (!btn) return;
    var idx = +btn.closest(".cart-item").getAttribute("data-idx");
    var a = btn.getAttribute("data-a");
    if (a === "plus") cart[idx].qty = Math.min(20, cart[idx].qty + 1);
    if (a === "minus") cart[idx].qty = Math.max(1, cart[idx].qty - 1);
    if (a === "remove") cart.splice(idx, 1);
    save(); renderCart();
  }

  function renderPayments() {
    $("#pay-options").innerHTML = CONFIG.pagamenti.map(function (m, i) {
      return '<label><input type="radio" name="pay" value="' + esc(m.id) + '"' + (i === 0 ? " checked" : "") + ' />' +
        '<span>' + esc(m.nome) + '<small>' + esc(m.info) + '</small></span></label>';
    }).join("");
    $("#pay-options").addEventListener("change", function (e) { payment = e.target.value; });
  }

  function renderSendButtons() {
    var html = "";
    if (CONFIG.whatsapp) html += '<button type="button" class="btn btn-wa" data-send="wa" ' + (cart.length ? "" : "disabled") + '>Invia ordine su WhatsApp</button>';
    if (CONFIG.email) html += '<button type="button" class="btn btn-mail" data-send="mail" ' + (cart.length ? "" : "disabled") + '>Invia ordine via email</button>';
    $("#send-buttons").innerHTML = html;
  }

  /* ---------- Invio ordine ---------- */
  function buildMessage(nome, tel, note) {
    var lines = ["*NUOVO ORDINE - A.C. Collinare*", ""];
    cart.forEach(function (i) {
      var p = findProduct(i.id);
      var l = "- " + i.qty + "x " + p.nome + " - Taglia " + i.taglia;
      if (i.pers) l += " - Personalizzata: " + ([i.nome, i.num].filter(Boolean).join(" "));
      l += " (" + euro(unitPrice(i) * i.qty) + ")";
      lines.push(l);
    });
    lines.push("", "Totale: " + euro(total()), "Pagamento: " + payment, "",
      "Cliente: " + nome, "Telefono: " + tel);
    if (note) lines.push("Note: " + note);
    return lines.join("\n");
  }

  function send(kind) {
    var nome = $("#nome").value.trim();
    var tel = $("#telefono").value.trim();
    var err = $("#form-error");
    $("#nome").parentNode.classList.toggle("bad", !nome);
    $("#telefono").parentNode.classList.toggle("bad", !tel);

    if (!cart.length) return;
    if (!nome || !tel) {
      err.textContent = "Inserisci nome e telefono per inviare l'ordine.";
      err.hidden = false;
      (nome ? $("#telefono") : $("#nome")).focus();
      return;
    }
    err.hidden = true;

    var msg = buildMessage(nome, tel, $("#note").value.trim());
    if (kind === "wa") {
      window.open("https://wa.me/" + CONFIG.whatsapp + "?text=" + encodeURIComponent(msg), "_blank", "noopener");
    } else {
      window.location.href = "mailto:" + CONFIG.email +
        "?subject=" + encodeURIComponent("Ordine shop Collinare - " + nome) +
        "&body=" + encodeURIComponent(msg.replace(/\*/g, ""));
    }
  }

  /* ---------- UI ---------- */
  function openCart() {
    $("#drawer").classList.add("open");
    $("#drawer").setAttribute("aria-hidden", "false");
    $("#overlay").hidden = false;
    document.body.style.overflow = "hidden";
  }
  function closeCart() {
    $("#drawer").classList.remove("open");
    $("#drawer").setAttribute("aria-hidden", "true");
    $("#overlay").hidden = true;
    document.body.style.overflow = "";
  }

  var toastTimer;
  function toast(text) {
    var t = $("#toast");
    t.textContent = text;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, 2200);
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderProducts();
    renderPayments();
    renderCart();

    $("#products").addEventListener("click", onProductsClick);
    $("#products").addEventListener("change", onProductsChange);
    $("#cart-list").addEventListener("click", onCartClick);
    $("#open-cart").addEventListener("click", openCart);
    $("#close-cart").addEventListener("click", closeCart);
    $("#overlay").addEventListener("click", closeCart);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeCart(); });
    $("#send-buttons").addEventListener("click", function (e) {
      var b = e.target.closest("[data-send]");
      if (b) send(b.getAttribute("data-send"));
    });
  });
})();
