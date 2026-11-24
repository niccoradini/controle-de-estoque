// Commercial names verified against the supplier catalog and manufacturer product records.
const MODELS = {
  "APPLE IPHONE 16 256GB N BR": {
    "family": "iPhone 16",
    "brand": "Apple",
    "memory": "256 GB",
    "color": "Branco",
    "imageKey": "iphone-16",
    "key": "iphone-16-256gb"
  },
  "APPLE IPHONE 16 256GB N PT": {
    "family": "iPhone 16",
    "brand": "Apple",
    "memory": "256 GB",
    "color": "Preto",
    "imageKey": "iphone-16",
    "key": "iphone-16-256gb"
  },
  "APPLE IPHONE 16E 256GB N BR": {
    "family": "iPhone 16e",
    "brand": "Apple",
    "memory": "256 GB",
    "color": "Branco",
    "imageKey": "iphone-16e",
    "key": "iphone-16e-256gb"
  },
  "APPLE IPHONE 16E 256GB N PT": {
    "family": "iPhone 16e",
    "brand": "Apple",
    "memory": "256 GB",
    "color": "Preto",
    "imageKey": "iphone-16e",
    "key": "iphone-16e-256gb"
  },
  "APPLE IPHONE 17 256GB N BR": {
    "family": "iPhone 17",
    "brand": "Apple",
    "memory": "256 GB",
    "color": "Branco",
    "imageKey": "iphone-17",
    "key": "iphone-17-256gb"
  },
  "APPLE IPHONE 17 256GB N PT": {
    "family": "iPhone 17",
    "brand": "Apple",
    "memory": "256 GB",
    "color": "Preto",
    "imageKey": "iphone-17",
    "key": "iphone-17-256gb"
  },
  "APPLE IPHONE AIR 512GB DR": {
    "family": "iPhone Air",
    "brand": "Apple",
    "memory": "512 GB",
    "color": "Dourado",
    "imageKey": "iphone-air",
    "key": "iphone-air-512gb"
  },
  "APPLE IPHONE 17 PRO 256GB AZM": {
    "family": "iPhone 17 Pro",
    "brand": "Apple",
    "memory": "256 GB",
    "color": "Azul-marinho",
    "imageKey": "iphone-17-pro",
    "key": "iphone-17-pro-256gb"
  },
  "APPLE IPHONE 17 PRO 256GB LJ": {
    "family": "iPhone 17 Pro",
    "brand": "Apple",
    "memory": "256 GB",
    "color": "Laranja",
    "imageKey": "iphone-17-pro",
    "key": "iphone-17-pro-256gb"
  },
  "APPLE IPHONE 17 PRO 512GB AZM": {
    "family": "iPhone 17 Pro",
    "brand": "Apple",
    "memory": "512 GB",
    "color": "Azul-marinho",
    "imageKey": "iphone-17-pro",
    "key": "iphone-17-pro-512gb"
  },
  "APPLE IPHONE 17 PRO MAX 256GB PR": {
    "family": "iPhone 17 Pro Max",
    "brand": "Apple",
    "memory": "256 GB",
    "color": "Prata",
    "imageKey": "iphone-17-pro-max",
    "key": "iphone-17-pro-max-256gb"
  },
  "APPLE IPHONE 17 PRO MAX 256GB AZM": {
    "family": "iPhone 17 Pro Max",
    "brand": "Apple",
    "memory": "256 GB",
    "color": "Azul-marinho",
    "imageKey": "iphone-17-pro-max",
    "key": "iphone-17-pro-max-256gb"
  },
  "APPLE IPHONE 17 PRO MAX 256GB LJ": {
    "family": "iPhone 17 Pro Max",
    "brand": "Apple",
    "memory": "256 GB",
    "color": "Laranja",
    "imageKey": "iphone-17-pro-max",
    "key": "iphone-17-pro-max-256gb"
  },
  "APPLE IPHONE 17 PRO MAX 512GB PR": {
    "family": "iPhone 17 Pro Max",
    "brand": "Apple",
    "memory": "512 GB",
    "color": "Prata",
    "imageKey": "iphone-17-pro-max",
    "key": "iphone-17-pro-max-512gb"
  },
  "APPLE IPHONE 17 PRO MAX 512GB AZM": {
    "family": "iPhone 17 Pro Max",
    "brand": "Apple",
    "memory": "512 GB",
    "color": "Azul-marinho",
    "imageKey": "iphone-17-pro-max",
    "key": "iphone-17-pro-max-512gb"
  },
  "APPLE IPHONE 18 PRO 256GB AZ": {
    "family": "iPhone 18 Pro",
    "brand": "Apple",
    "memory": "256 GB",
    "color": "Azul",
    "imageKey": "iphone-18-pro",
    "key": "iphone-18-pro-256gb"
  },
  "APPLE IPHONE 18 PRO 256GB PT": {
    "family": "iPhone 18 Pro",
    "brand": "Apple",
    "memory": "256 GB",
    "color": "Preto",
    "imageKey": "iphone-18-pro",
    "key": "iphone-18-pro-256gb"
  },
  "APPLE IPHONE 18 PMAX 256GB VH": {
    "family": "iPhone 18 Pro Max",
    "brand": "Apple",
    "memory": "256 GB",
    "color": "Bordô",
    "imageKey": "iphone-18-pro-max",
    "key": "iphone-18-pro-max-256gb"
  },
  "APPLE IPHONE 18 PMAX 512GB PT": {
    "family": "iPhone 18 Pro Max",
    "brand": "Apple",
    "memory": "512 GB",
    "color": "Preto",
    "imageKey": "iphone-18-pro-max",
    "key": "iphone-18-pro-max-512gb"
  },
  "APPLE IPHONE 18 PMAX 1TB PR": {
    "family": "iPhone 18 Pro Max",
    "brand": "Apple",
    "memory": "1 TB",
    "color": "Prata",
    "imageKey": "iphone-18-pro-max",
    "key": "iphone-18-pro-max-1tb"
  },
  "MOTOROLA XT2503-1 SMARTPHONE 256GB CZ": {
    "family": "Motorola Edge 60 Fusion",
    "brand": "Motorola",
    "memory": "256 GB",
    "color": "Cinza",
    "imageKey": "motorola-edge-60-fusion",
    "key": "motorola-edge-60-fusion-256gb"
  },
  "MOTOROLA XT2507-1 SMARTPHONE 512GB CZ": {
    "family": "Motorola Edge 60 Pro",
    "brand": "Motorola",
    "memory": "512 GB",
    "color": "Cinza",
    "imageKey": "motorola-edge-60-pro",
    "key": "motorola-edge-60-pro-512gb"
  },
  "MOTOROLA XT2527-1 SMARTPHONE 256GB GF": {
    "family": "Motorola Moto G86 5G",
    "brand": "Motorola",
    "memory": "256 GB",
    "color": "Grafite",
    "imageKey": "motorola-moto-g86-5g",
    "key": "motorola-moto-g86-5g-256gb"
  },
  "MOTOROLA XT2535-1 SMARTPHONE 128GB AZM": {
    "family": "Motorola Moto G06",
    "brand": "Motorola",
    "memory": "128 GB",
    "color": "Azul-marinho",
    "imageKey": "motorola-moto-g06",
    "key": "motorola-moto-g06-128gb"
  },
  "MOTOROLA XT2601-3 SMARTPHONE 512GB GF": {
    "family": "Motorola Edge 70",
    "brand": "Motorola",
    "memory": "512 GB",
    "color": "Grafite",
    "imageKey": "motorola-edge-70",
    "key": "motorola-edge-70-512gb"
  },
  "MOTOROLA XT2601-3 SMARTPHONE 512GB CZ": {
    "family": "Motorola Edge 70",
    "brand": "Motorola",
    "memory": "512 GB",
    "color": "Cinza",
    "imageKey": "motorola-edge-70",
    "key": "motorola-edge-70-512gb"
  },
  "MOTOROLA XT2601-3 SMARTPHONE 512GB VD": {
    "family": "Motorola Edge 70",
    "brand": "Motorola",
    "memory": "512 GB",
    "color": "Verde",
    "imageKey": "motorola-edge-70",
    "key": "motorola-edge-70-512gb"
  },
  "MOTOROLA XT2621-1 SMARTPHONE 128GB CZ": {
    "family": "Motorola Moto G67 5G",
    "brand": "Motorola",
    "memory": "128 GB",
    "color": "Cinza",
    "imageKey": "motorola-moto-g67-5g",
    "key": "motorola-moto-g67-5g-128gb"
  },
  "MOTOROLA XT2621-1 SMARTPHONE 256GB CZ": {
    "family": "Motorola Moto G67 5G",
    "brand": "Motorola",
    "memory": "256 GB",
    "color": "Cinza",
    "imageKey": "motorola-moto-g67-5g",
    "key": "motorola-moto-g67-5g-256gb"
  },
  "MOTOROLA XT2621-1 SMARTPHONE 256GB VD": {
    "family": "Motorola Moto G67 5G",
    "brand": "Motorola",
    "memory": "256 GB",
    "color": "Verde",
    "imageKey": "motorola-moto-g67-5g",
    "key": "motorola-moto-g67-5g-256gb"
  },
  "MOTOROLA XT2603-2 SMARTPHONE 512GB PT": {
    "family": "Motorola Signature",
    "brand": "Motorola",
    "memory": "512 GB",
    "color": "Preto",
    "imageKey": "motorola-signature",
    "key": "motorola-signature-512gb"
  },
  "MOTOROLA XT2601-3 SMARTPHONE 256GB GF": {
    "family": "Motorola Edge 70",
    "brand": "Motorola",
    "memory": "256 GB",
    "color": "Grafite",
    "imageKey": "motorola-edge-70",
    "key": "motorola-edge-70-256gb"
  },
  "MOTOROLA XT2601-3 SMARTPHONE 256GB VD": {
    "family": "Motorola Edge 70",
    "brand": "Motorola",
    "memory": "256 GB",
    "color": "Verde",
    "imageKey": "motorola-edge-70",
    "key": "motorola-edge-70-256gb"
  },
  "MOTOROLA XT2621-5 SMARTPHONE 256GB GF": {
    "family": "Motorola Moto G Max 5G",
    "brand": "Motorola",
    "memory": "256 GB",
    "color": "Grafite",
    "imageKey": "motorola-moto-g-max-5g",
    "key": "motorola-moto-g-max-5g-256gb"
  },
  "MOTOROLA XT2625-1 SMARTPHONE 128GB GF": {
    "family": "Motorola Moto G47 5G",
    "brand": "Motorola",
    "memory": "128 GB",
    "color": "Grafite",
    "imageKey": "motorola-moto-g47-5g",
    "key": "motorola-moto-g47-5g-128gb"
  },
  "MOTOROLA XT2625-1 SMARTPHONE 128GB AZM": {
    "family": "Motorola Moto G47 5G",
    "brand": "Motorola",
    "memory": "128 GB",
    "color": "Azul-marinho",
    "imageKey": "motorola-moto-g47-5g",
    "key": "motorola-moto-g47-5g-128gb"
  },
  "MOTOROLA XT2625-13 SMARTPHONE 128GB GF": {
    "family": "Motorola Moto G37 5G",
    "brand": "Motorola",
    "memory": "128 GB",
    "color": "Grafite",
    "imageKey": "motorola-moto-g37-5g",
    "key": "motorola-moto-g37-5g-128gb"
  },
  "MOTOROLA XT2625-13 SMARTPHONE 128GB AZM": {
    "family": "Motorola Moto G37 5G",
    "brand": "Motorola",
    "memory": "128 GB",
    "color": "Azul-marinho",
    "imageKey": "motorola-moto-g37-5g",
    "key": "motorola-moto-g37-5g-128gb"
  },
  "OPPO SMARTPHONE A5 5G 256GB VD": {
    "family": "OPPO A5 5G",
    "brand": "OPPO",
    "memory": "256 GB",
    "color": "Verde",
    "imageKey": "oppo-a5-5g",
    "key": "oppo-a5-5g-256gb"
  },
  "OPPO SMART A6X 5G 256GB VT": {
    "family": "OPPO A6x 5G",
    "brand": "OPPO",
    "memory": "256 GB",
    "color": "Violeta",
    "imageKey": "oppo-a6x-5g",
    "key": "oppo-a6x-5g-256gb"
  },
  "OPPO SMARTPHONE RENO 16 512GB VT": {
    "family": "OPPO Reno16",
    "brand": "OPPO",
    "memory": "512 GB",
    "color": "Violeta",
    "imageKey": "oppo-reno16",
    "key": "oppo-reno16-512gb"
  },
  "OPPO SMARTPHONE RENO 16F 256GB BR": {
    "family": "OPPO Reno16 F",
    "brand": "OPPO",
    "memory": "256 GB",
    "color": "Branco",
    "imageKey": "oppo-reno16-f",
    "key": "oppo-reno16-f-256gb"
  },
  "OPPO SMARTPHONE RENO 16F 256GB VT": {
    "family": "OPPO Reno16 F",
    "brand": "OPPO",
    "memory": "256 GB",
    "color": "Violeta",
    "imageKey": "oppo-reno16-f",
    "key": "oppo-reno16-f-256gb"
  },
  "SSG GALAXY S931B 256GB PR PPB/P291/14": {
    "family": "Samsung Galaxy S25",
    "brand": "Samsung",
    "memory": "256 GB",
    "color": "Prata",
    "imageKey": "samsung-galaxy-s25",
    "key": "samsung-galaxy-s25-256gb"
  },
  "SSG GALAXY S938B 256GB TN PT PPB/P291/14": {
    "family": "Samsung Galaxy S25 Ultra",
    "brand": "Samsung",
    "memory": "256 GB",
    "color": "Preto",
    "imageKey": "samsung-galaxy-s25-ultra",
    "key": "samsung-galaxy-s25-ultra-256gb"
  },
  "SSG GALAXY S938B 256GB TN CZ PPB/P291/14": {
    "family": "Samsung Galaxy S25 Ultra",
    "brand": "Samsung",
    "memory": "256 GB",
    "color": "Cinza",
    "imageKey": "samsung-galaxy-s25-ultra",
    "key": "samsung-galaxy-s25-ultra-256gb"
  },
  "SSG GALAXY A366E 256GB PT PPB/P291/14": {
    "family": "Samsung Galaxy A36 5G",
    "brand": "Samsung",
    "memory": "256 GB",
    "color": "Preto",
    "imageKey": "samsung-galaxy-a36-5g",
    "key": "samsung-galaxy-a36-5g-256gb"
  },
  "SSG GALAXY A075M 128GB PT PPB/P291/14": {
    "family": "Samsung Galaxy A07 4G",
    "brand": "Samsung",
    "memory": "128 GB",
    "color": "Preto",
    "imageKey": "samsung-galaxy-a07-4g",
    "key": "samsung-galaxy-a07-4g-128gb"
  },
  "SSG GALAXY A176B 128GB PT PPB/P291/14": {
    "family": "Samsung Galaxy A17 5G",
    "brand": "Samsung",
    "memory": "128 GB",
    "color": "Preto",
    "imageKey": "samsung-galaxy-a17-5g",
    "key": "samsung-galaxy-a17-5g-128gb"
  },
  "SSG GALAXY A176B 128GB CZ PPB/P291/12": {
    "family": "Samsung Galaxy A17 5G",
    "brand": "Samsung",
    "memory": "128 GB",
    "color": "Cinza",
    "imageKey": "samsung-galaxy-a17-5g",
    "key": "samsung-galaxy-a17-5g-128gb"
  },
  "SSG GALAXY S731B 256GB PT PPB/P291/12": {
    "family": "Samsung Galaxy S25 FE",
    "brand": "Samsung",
    "memory": "256 GB",
    "color": "Preto",
    "imageKey": "samsung-galaxy-s25-fe",
    "key": "samsung-galaxy-s25-fe-256gb"
  },
  "SSG GALAXY S948B 256GB AZ PPB/P291/14": {
    "family": "Samsung Galaxy S26 Ultra",
    "brand": "Samsung",
    "memory": "256 GB",
    "color": "Azul",
    "imageKey": "samsung-galaxy-s26-ultra",
    "key": "samsung-galaxy-s26-ultra-256gb"
  },
  "SSG GALAXY S948B 256GB PT PPB/P291/12": {
    "family": "Samsung Galaxy S26 Ultra",
    "brand": "Samsung",
    "memory": "256 GB",
    "color": "Preto",
    "imageKey": "samsung-galaxy-s26-ultra",
    "key": "samsung-galaxy-s26-ultra-256gb"
  },
  "SSG GALAXY S948B 256GB PT PPB/P291/14": {
    "family": "Samsung Galaxy S26 Ultra",
    "brand": "Samsung",
    "memory": "256 GB",
    "color": "Preto",
    "imageKey": "samsung-galaxy-s26-ultra",
    "key": "samsung-galaxy-s26-ultra-256gb"
  },
  "SSG GALAXY S947B 256GB VT PPB/P291/14": {
    "family": "Samsung Galaxy S26+",
    "brand": "Samsung",
    "memory": "256 GB",
    "color": "Violeta",
    "imageKey": "samsung-galaxy-s26-plus",
    "key": "samsung-galaxy-s26-plus-256gb"
  },
  "SSG GALAXY S947B 512GB PT PPB/P291/14": {
    "family": "Samsung Galaxy S26+",
    "brand": "Samsung",
    "memory": "512 GB",
    "color": "Preto",
    "imageKey": "samsung-galaxy-s26-plus",
    "key": "samsung-galaxy-s26-plus-512gb"
  },
  "SSG GALAXY S947B 512GB VT PPB/P291/14": {
    "family": "Samsung Galaxy S26+",
    "brand": "Samsung",
    "memory": "512 GB",
    "color": "Violeta",
    "imageKey": "samsung-galaxy-s26-plus",
    "key": "samsung-galaxy-s26-plus-512gb"
  },
  "SSG GALAXY S942B 256GB PT PPB/P291/12": {
    "family": "Samsung Galaxy S26",
    "brand": "Samsung",
    "memory": "256 GB",
    "color": "Preto",
    "imageKey": "samsung-galaxy-s26",
    "key": "samsung-galaxy-s26-256gb"
  },
  "SSG GALAXY S942B 256GB VT PPB/P291/14": {
    "family": "Samsung Galaxy S26",
    "brand": "Samsung",
    "memory": "256 GB",
    "color": "Violeta",
    "imageKey": "samsung-galaxy-s26",
    "key": "samsung-galaxy-s26-256gb"
  },
  "SSG GALAXY S942B 512GB PT PPB/P291/12": {
    "family": "Samsung Galaxy S26",
    "brand": "Samsung",
    "memory": "512 GB",
    "color": "Preto",
    "imageKey": "samsung-galaxy-s26",
    "key": "samsung-galaxy-s26-512gb"
  },
  "SSG GALAXY A376B 256GB BRPPB/P291/14": {
    "family": "Samsung Galaxy A37 5G",
    "brand": "Samsung",
    "memory": "256 GB",
    "color": "Branco",
    "imageKey": "samsung-galaxy-a37-5g",
    "key": "samsung-galaxy-a37-5g-256gb"
  },
  "SSG GALAXY A376B 256GB PTPPB/P291/14": {
    "family": "Samsung Galaxy A37 5G",
    "brand": "Samsung",
    "memory": "256 GB",
    "color": "Preto",
    "imageKey": "samsung-galaxy-a37-5g",
    "key": "samsung-galaxy-a37-5g-256gb"
  },
  "SSG GALAXY A376B 256GB LL PPB/P291/14": {
    "family": "Samsung Galaxy A37 5G",
    "brand": "Samsung",
    "memory": "256 GB",
    "color": "Lilás",
    "imageKey": "samsung-galaxy-a37-5g",
    "key": "samsung-galaxy-a37-5g-256gb"
  },
  "SSG GALAXY A576B 256GB AZMPPB/P291/14": {
    "family": "Samsung Galaxy A57 5G",
    "brand": "Samsung",
    "memory": "256 GB",
    "color": "Azul-marinho",
    "imageKey": "samsung-galaxy-a57-5g",
    "key": "samsung-galaxy-a57-5g-256gb"
  },
  "SSG GALAXY A576B 256GB CZPPB/P291/14": {
    "family": "Samsung Galaxy A57 5G",
    "brand": "Samsung",
    "memory": "256 GB",
    "color": "Cinza",
    "imageKey": "samsung-galaxy-a57-5g",
    "key": "samsung-galaxy-a57-5g-256gb"
  },
  "SSG GALAXY A076M 128GB PT PPB/P291/12": {
    "family": "Samsung Galaxy A07 5G",
    "brand": "Samsung",
    "memory": "128 GB",
    "color": "Preto",
    "imageKey": "samsung-galaxy-a07-5g",
    "key": "samsung-galaxy-a07-5g-128gb"
  },
  "SSG GALAXY A276B 256GB AZ PPB/P291/14": {
    "family": "Samsung Galaxy A27 5G",
    "brand": "Samsung",
    "memory": "256 GB",
    "color": "Azul",
    "imageKey": "samsung-galaxy-a27-5g",
    "key": "samsung-galaxy-a27-5g-256gb"
  },
  "SSG GALAXY A276B 256GB PT PPB/P291/14": {
    "family": "Samsung Galaxy A27 5G",
    "brand": "Samsung",
    "memory": "256 GB",
    "color": "Preto",
    "imageKey": "samsung-galaxy-a27-5g",
    "key": "samsung-galaxy-a27-5g-256gb"
  },
  "SSG GALAXY S741B 256GB AZ PPB/P291/14": {
    "family": "Samsung Galaxy S26 FE",
    "brand": "Samsung",
    "memory": "256 GB",
    "color": "Azul",
    "imageKey": "samsung-galaxy-s26-fe",
    "key": "samsung-galaxy-s26-fe-256gb"
  },
  "SSG GALAXY S741B 256GB GF PPB/P291/14": {
    "family": "Samsung Galaxy S26 FE",
    "brand": "Samsung",
    "memory": "256 GB",
    "color": "Grafite",
    "imageKey": "samsung-galaxy-s26-fe",
    "key": "samsung-galaxy-s26-fe-256gb"
  },
  "APPLE IPHONE 15 256GB N AZ": {
    "family": "iPhone 15",
    "brand": "Apple",
    "memory": "256 GB",
    "color": "Azul",
    "imageKey": "iphone-15",
    "key": "iphone-15-256gb"
  },
  "APPLE IPHONE 15 256GB N PT": {
    "family": "iPhone 15",
    "brand": "Apple",
    "memory": "256 GB",
    "color": "Preto",
    "imageKey": "iphone-15",
    "key": "iphone-15-256gb"
  },
  "APPLE IPHONE 17 256GB N VD": {
    "family": "iPhone 17",
    "brand": "Apple",
    "memory": "256 GB",
    "color": "Verde",
    "imageKey": "iphone-17",
    "key": "iphone-17-256gb"
  },
  "APPLE IPHONE 17 512GB N PT": {
    "family": "iPhone 17",
    "brand": "Apple",
    "memory": "512 GB",
    "color": "Preto",
    "imageKey": "iphone-17",
    "key": "iphone-17-512gb"
  },
  "APPLE IPHONE AIR 512GB PT": {
    "family": "iPhone Air",
    "brand": "Apple",
    "memory": "512 GB",
    "color": "Preto",
    "imageKey": "iphone-air",
    "key": "iphone-air-512gb"
  },
  "APPLE IPHONE 17 PRO 256GB PR": {
    "family": "iPhone 17 Pro",
    "brand": "Apple",
    "memory": "256 GB",
    "color": "Prata",
    "imageKey": "iphone-17-pro",
    "key": "iphone-17-pro-256gb"
  },
  "APPLE IPHONE 17 PRO 512GB PR": {
    "family": "iPhone 17 Pro",
    "brand": "Apple",
    "memory": "512 GB",
    "color": "Prata",
    "imageKey": "iphone-17-pro",
    "key": "iphone-17-pro-512gb"
  },
  "APPLE IPHONE 17 PRO MAX 512GB LJ": {
    "family": "iPhone 17 Pro Max",
    "brand": "Apple",
    "memory": "512 GB",
    "color": "Laranja",
    "imageKey": "iphone-17-pro-max",
    "key": "iphone-17-pro-max-512gb"
  },
  "APPLE IPHONE 17 PRO MAX 1TB AZM": {
    "family": "iPhone 17 Pro Max",
    "brand": "Apple",
    "memory": "1 TB",
    "color": "Azul-marinho",
    "imageKey": "iphone-17-pro-max",
    "key": "iphone-17-pro-max-1tb"
  },
  "APPLE IPHONE 18 PRO 256GB VH": {
    "family": "iPhone 18 Pro",
    "brand": "Apple",
    "memory": "256 GB",
    "color": "Bordô",
    "imageKey": "iphone-18-pro",
    "key": "iphone-18-pro-256gb"
  },
  "APPLE IPHONE 18 PMAX 512GB AZ": {
    "family": "iPhone 18 Pro Max",
    "brand": "Apple",
    "memory": "512 GB",
    "color": "Azul",
    "imageKey": "iphone-18-pro-max",
    "key": "iphone-18-pro-max-512gb"
  },
  "MOTOROLA XT2507-1 SMARTPHONE 256GB AZ": {
    "family": "Motorola Edge 60 Pro",
    "brand": "Motorola",
    "memory": "256 GB",
    "color": "Azul",
    "imageKey": "motorola-edge-60-pro",
    "key": "motorola-edge-60-pro-256gb"
  },
  "MOTOROLA XT2621-1 SMARTPHONE 128GB VD": {
    "family": "Motorola Moto G67 5G",
    "brand": "Motorola",
    "memory": "128 GB",
    "color": "Verde",
    "imageKey": "motorola-moto-g67-5g",
    "key": "motorola-moto-g67-5g-128gb"
  },
  "MOTOROLA XT2605-3 SMARTPHONE 256GB AZ": {
    "family": "Motorola Edge 70 Fusion",
    "brand": "Motorola",
    "memory": "256 GB",
    "color": "Azul",
    "imageKey": "motorola-edge-70-fusion",
    "key": "motorola-edge-70-fusion-256gb"
  },
  "MOTOROLA XT2621-5 SMARTPHONE 256GB AZ": {
    "family": "Motorola Moto G Max 5G",
    "brand": "Motorola",
    "memory": "256 GB",
    "color": "Azul",
    "imageKey": "motorola-moto-g-max-5g",
    "key": "motorola-moto-g-max-5g-256gb"
  },
  "MOTOROLA XT2605-3 SMARTPHONE 12/256GB GF": {
    "family": "Motorola Edge 70 Fusion",
    "brand": "Motorola",
    "memory": "256 GB",
    "color": "Grafite",
    "imageKey": "motorola-edge-70-fusion",
    "key": "motorola-edge-70-fusion-256gb"
  },
  "SSG GALAXY A566E 256GB PT PPB/P291/14": {
    "family": "Samsung Galaxy A56 5G",
    "brand": "Samsung",
    "memory": "256 GB",
    "color": "Preto",
    "imageKey": "samsung-galaxy-a56-5g",
    "key": "samsung-galaxy-a56-5g-256gb"
  },
  "SSG GALAXY A176B 128GB CZ PPB/P291/14": {
    "family": "Samsung Galaxy A17 5G",
    "brand": "Samsung",
    "memory": "128 GB",
    "color": "Cinza",
    "imageKey": "samsung-galaxy-a17-5g",
    "key": "samsung-galaxy-a17-5g-128gb"
  },
  "SSG GALAXY A176B 256GB PT PPB/P291/14": {
    "family": "Samsung Galaxy A17 5G",
    "brand": "Samsung",
    "memory": "256 GB",
    "color": "Preto",
    "imageKey": "samsung-galaxy-a17-5g",
    "key": "samsung-galaxy-a17-5g-256gb"
  },
  "SSG GALAXY S731B 256GB PT PPB/P291/14": {
    "family": "Samsung Galaxy S25 FE",
    "brand": "Samsung",
    "memory": "256 GB",
    "color": "Preto",
    "imageKey": "samsung-galaxy-s25-fe",
    "key": "samsung-galaxy-s25-fe-256gb"
  },
  "SSG GALAXY S947B 256GB PT PPB/P291/14": {
    "family": "Samsung Galaxy S26+",
    "brand": "Samsung",
    "memory": "256 GB",
    "color": "Preto",
    "imageKey": "samsung-galaxy-s26-plus",
    "key": "samsung-galaxy-s26-plus-256gb"
  },
  "SSG GALAXY A376B 256GB PTPPB/P291/12": {
    "family": "Samsung Galaxy A37 5G",
    "brand": "Samsung",
    "memory": "256 GB",
    "color": "Preto",
    "imageKey": "samsung-galaxy-a37-5g",
    "key": "samsung-galaxy-a37-5g-256gb"
  },
  "SSG GALAXY F776B 256GB PT PPB/P291/12": {
    "family": "Samsung Galaxy Z Flip8",
    "brand": "Samsung",
    "memory": "256 GB",
    "color": "Preto",
    "imageKey": "samsung-galaxy-z-flip8",
    "key": "samsung-galaxy-z-flip8-256gb"
  },
  "APPLE IPHONE 13 256GB PT N": {
    "family": "iPhone 13",
    "brand": "Apple",
    "memory": "256 GB",
    "color": "Preto",
    "imageKey": "iphone-13",
    "key": "iphone-13-256gb"
  },
  "APPLE IPHONE AIR 1TB PT": {
    "family": "iPhone Air",
    "brand": "Apple",
    "memory": "1 TB",
    "color": "Preto",
    "imageKey": "iphone-air",
    "key": "iphone-air-1tb"
  },
  "APPLE IPHONE 17 PRO MAX 256GB LJ DEMO": {
    "family": "iPhone 17 Pro Max",
    "brand": "Apple",
    "memory": "256 GB",
    "color": "Laranja",
    "imageKey": "iphone-17-pro-max",
    "key": "iphone-17-pro-max-256gb"
  },
  "APPLE IPHONE 17 PRO MAX 1TB PR": {
    "family": "iPhone 17 Pro Max",
    "brand": "Apple",
    "memory": "1 TB",
    "color": "Prata",
    "imageKey": "iphone-17-pro-max",
    "key": "iphone-17-pro-max-1tb"
  },
  "APPLE IPHONE 17 PRO MAX 1TB LJ": {
    "family": "iPhone 17 Pro Max",
    "brand": "Apple",
    "memory": "1 TB",
    "color": "Laranja",
    "imageKey": "iphone-17-pro-max",
    "key": "iphone-17-pro-max-1tb"
  },
  "APPLE IPHONE 17 PRO MAX 2TB LJ": {
    "family": "iPhone 17 Pro Max",
    "brand": "Apple",
    "memory": "2 TB",
    "color": "Laranja",
    "imageKey": "iphone-17-pro-max",
    "key": "iphone-17-pro-max-2tb"
  },
  "APPLE IPHONE 17E 256GB RS DEMO": {
    "family": "iPhone 17e",
    "brand": "Apple",
    "memory": "256 GB",
    "color": "Rosa",
    "imageKey": "iphone-17e",
    "key": "iphone-17e-256gb"
  },
  "APPLE IPHONE 18 PMAX 512GB VH": {
    "family": "iPhone 18 Pro Max",
    "brand": "Apple",
    "memory": "512 GB",
    "color": "Bordô",
    "imageKey": "iphone-18-pro-max",
    "key": "iphone-18-pro-max-512gb"
  },
  "MOTOROLA XT2433-1 SMARTPHONE 128GB GF": {
    "family": "Motorola Moto G35 5G",
    "brand": "Motorola",
    "memory": "128 GB",
    "color": "Grafite",
    "imageKey": "motorola-moto-g35-5g",
    "key": "motorola-moto-g35-5g-128gb"
  },
  "MOTOROLA XT2529-1 SMARTPHONE 256GB GF": {
    "family": "Motorola Moto G56 5G",
    "brand": "Motorola",
    "memory": "256 GB",
    "color": "Grafite",
    "imageKey": "motorola-moto-g56-5g",
    "key": "motorola-moto-g56-5g-256gb"
  },
  "MOTOROLA XT2527-1 SMARTPHONE 256GB VM": {
    "family": "Motorola Moto G86 5G",
    "brand": "Motorola",
    "memory": "256 GB",
    "color": "Vermelho",
    "imageKey": "motorola-moto-g86-5g",
    "key": "motorola-moto-g86-5g-256gb"
  },
  "MOTOROLA XT2621-3 SMARTPHONE 256GB MR": {
    "family": "Motorola Moto G77 5G",
    "brand": "Motorola",
    "memory": "256 GB",
    "color": "Marrom",
    "imageKey": "motorola-moto-g77-5g",
    "key": "motorola-moto-g77-5g-256gb"
  },
  "OPPO SMART A5 5G 256GB VD": {
    "family": "OPPO A5 5G",
    "brand": "OPPO",
    "memory": "256 GB",
    "color": "Verde",
    "imageKey": "oppo-a5-5g",
    "key": "oppo-a5-5g-256gb"
  },
  "SSG GALAXY A266M 256GB PT PPB/P291/14": {
    "family": "Samsung Galaxy A26 5G",
    "brand": "Samsung",
    "memory": "256 GB",
    "color": "Preto",
    "imageKey": "samsung-galaxy-a26-5g",
    "key": "samsung-galaxy-a26-5g-256gb"
  },
  "SSG GALAXY S937B 512GB TN PT PPB/P291/12": {
    "family": "Samsung Galaxy S25 Edge",
    "brand": "Samsung",
    "memory": "512 GB",
    "color": "Preto",
    "imageKey": "samsung-galaxy-s25-edge",
    "key": "samsung-galaxy-s25-edge-512gb"
  },
  "SSG GALAXY A176B 128GB AZ PPB/P291/14": {
    "family": "Samsung Galaxy A17 5G",
    "brand": "Samsung",
    "memory": "128 GB",
    "color": "Azul",
    "imageKey": "samsung-galaxy-a17-5g",
    "key": "samsung-galaxy-a17-5g-128gb"
  },
  "SSG GALAXY S942B 256GB BR PPB/P291/14": {
    "family": "Samsung Galaxy S26",
    "brand": "Samsung",
    "memory": "256 GB",
    "color": "Branco",
    "imageKey": "samsung-galaxy-s26",
    "key": "samsung-galaxy-s26-256gb"
  },
  "SSG GALAXY S942B 256GB PT PPB/P291/14": {
    "family": "Samsung Galaxy S26",
    "brand": "Samsung",
    "memory": "256 GB",
    "color": "Preto",
    "imageKey": "samsung-galaxy-s26",
    "key": "samsung-galaxy-s26-256gb"
  },
  "SSG GALAXY S942B 256GB VT PPB/P291/12": {
    "family": "Samsung Galaxy S26",
    "brand": "Samsung",
    "memory": "256 GB",
    "color": "Violeta",
    "imageKey": "samsung-galaxy-s26",
    "key": "samsung-galaxy-s26-256gb"
  },
  "SSG GALAXY A276B 256GB PT PPB/P291/12": {
    "family": "Samsung Galaxy A27 5G",
    "brand": "Samsung",
    "memory": "256 GB",
    "color": "Preto",
    "imageKey": "samsung-galaxy-a27-5g",
    "key": "samsung-galaxy-a27-5g-256gb"
  },
  "SSG GALAXY F776B 512GB PT PPB/P291/12": {
    "family": "Samsung Galaxy Z Flip8",
    "brand": "Samsung",
    "memory": "512 GB",
    "color": "Preto",
    "imageKey": "samsung-galaxy-z-flip8",
    "key": "samsung-galaxy-z-flip8-512gb"
  },
  "SSG GALAXY F776B 512GB RS PPB/P291/12": {
    "family": "Samsung Galaxy Z Flip8",
    "brand": "Samsung",
    "memory": "512 GB",
    "color": "Rosa",
    "imageKey": "samsung-galaxy-z-flip8",
    "key": "samsung-galaxy-z-flip8-512gb"
  },
  "SSG GALAXY F971B 512GB PT PPB/P291/12": {
    "family": "Samsung Galaxy Z Fold8",
    "brand": "Samsung",
    "memory": "512 GB",
    "color": "Preto",
    "imageKey": "samsung-galaxy-z-fold8",
    "key": "samsung-galaxy-z-fold8-512gb"
  },
  "SSG GALAXY F976B 256GB PT PPB/P291/12": {
    "family": "Samsung Galaxy Z Fold8 Ultra",
    "brand": "Samsung",
    "memory": "256 GB",
    "color": "Preto",
    "imageKey": "samsung-galaxy-z-fold8-ultra",
    "key": "samsung-galaxy-z-fold8-ultra-256gb"
  },
  "SSG GALAXY F976B 512GB PT PPB/P291/12": {
    "family": "Samsung Galaxy Z Fold8 Ultra",
    "brand": "Samsung",
    "memory": "512 GB",
    "color": "Preto",
    "imageKey": "samsung-galaxy-z-fold8-ultra",
    "key": "samsung-galaxy-z-fold8-ultra-512gb"
  },
  "SSG GALAXY F976B 512GB RX PPB/P291/12": {
    "family": "Samsung Galaxy Z Fold8 Ultra",
    "brand": "Samsung",
    "memory": "512 GB",
    "color": "Roxo",
    "imageKey": "samsung-galaxy-z-fold8-ultra",
    "key": "samsung-galaxy-z-fold8-ultra-512gb"
  },
  "SSG GALAXY S741B 256GB VD PPB/P291/14": {
    "family": "Samsung Galaxy S26 FE",
    "brand": "Samsung",
    "memory": "256 GB",
    "color": "Verde",
    "imageKey": "samsung-galaxy-s26-fe",
    "key": "samsung-galaxy-s26-fe-256gb"
  },
  "APPLE IPHONE 17 PRO 512GB LJ": {
    "family": "iPhone 17 Pro",
    "brand": "Apple",
    "memory": "512 GB",
    "color": "Laranja",
    "imageKey": "iphone-17-pro",
    "key": "iphone-17-pro-512gb"
  },
  "MOTOROLA XT2605-3 SMARTPHONE 256GB GF": {
    "family": "Motorola Edge 70 Fusion",
    "brand": "Motorola",
    "memory": "256 GB",
    "color": "Grafite",
    "imageKey": "motorola-edge-70-fusion",
    "key": "motorola-edge-70-fusion-256gb"
  },
  "SSG GALAXY A166M 128GB CZ PPB/P291/14": {
    "family": "Samsung Galaxy A16 5G",
    "brand": "Samsung",
    "memory": "128 GB",
    "color": "Cinza",
    "imageKey": "samsung-galaxy-a16-5g",
    "key": "samsung-galaxy-a16-5g-128gb"
  },
  "SSG GALAXY A266M 256GB BR PPB/P291/14": {
    "family": "Samsung Galaxy A26 5G",
    "brand": "Samsung",
    "memory": "256 GB",
    "color": "Branco",
    "imageKey": "samsung-galaxy-a26-5g",
    "key": "samsung-galaxy-a26-5g-256gb"
  },
  "SSG GALAXY S948B 512GB PT PPB/P291/14": {
    "family": "Samsung Galaxy S26 Ultra",
    "brand": "Samsung",
    "memory": "512 GB",
    "color": "Preto",
    "imageKey": "samsung-galaxy-s26-ultra",
    "key": "samsung-galaxy-s26-ultra-512gb"
  },
  "SSG GALAXY S741B 256GB AZ PPB/P291/12": {
    "family": "Samsung Galaxy S26 FE",
    "brand": "Samsung",
    "memory": "256 GB",
    "color": "Azul",
    "imageKey": "samsung-galaxy-s26-fe",
    "key": "samsung-galaxy-s26-fe-256gb"
  },
  "APPLE IPHONE 16 PRO MAX 256GB BZ": {
    "family": "iPhone 16 Pro Max",
    "brand": "Apple",
    "memory": "256 GB",
    "color": "Bronze",
    "imageKey": "iphone-16-pro-max",
    "key": "iphone-16-pro-max-256gb"
  },
  "APPLE IPHONE 17 512GB N BR": {
    "family": "iPhone 17",
    "brand": "Apple",
    "memory": "512 GB",
    "color": "Branco",
    "imageKey": "iphone-17",
    "key": "iphone-17-512gb"
  },
  "APPLE IPHONE AIR 256GB PT": {
    "family": "iPhone Air",
    "brand": "Apple",
    "memory": "256 GB",
    "color": "Preto",
    "imageKey": "iphone-air",
    "key": "iphone-air-256gb"
  },
  "APPLE IPHONE 17E 256GB N BR": {
    "family": "iPhone 17e",
    "brand": "Apple",
    "memory": "256 GB",
    "color": "Branco",
    "imageKey": "iphone-17e",
    "key": "iphone-17e-256gb"
  },
  "APPLE IPHONE 18 PMAX 256GB PT": {
    "family": "iPhone 18 Pro Max",
    "brand": "Apple",
    "memory": "256 GB",
    "color": "Preto",
    "imageKey": "iphone-18-pro-max",
    "key": "iphone-18-pro-max-256gb"
  },
  "MOTOROLA XT2433-1 SMARTPHONE 128GB VD": {
    "family": "Motorola Moto G35 5G",
    "brand": "Motorola",
    "memory": "128 GB",
    "color": "Verde",
    "imageKey": "motorola-moto-g35-5g",
    "key": "motorola-moto-g35-5g-128gb"
  },
  "SSG GALAXY A066M 128GB PT PPB/P291/14": {
    "family": "Samsung Galaxy A06 5G",
    "brand": "Samsung",
    "memory": "128 GB",
    "color": "Preto",
    "imageKey": "samsung-galaxy-a06-5g",
    "key": "samsung-galaxy-a06-5g-128gb"
  },
  "SSG GALAXY A066M 128GB CZ PPB/P291/12": {
    "family": "Samsung Galaxy A06 5G",
    "brand": "Samsung",
    "memory": "128 GB",
    "color": "Cinza",
    "imageKey": "samsung-galaxy-a06-5g",
    "key": "samsung-galaxy-a06-5g-128gb"
  },
  "SSG GALAXY A366E 256GB BR PPB/P291/14": {
    "family": "Samsung Galaxy A36 5G",
    "brand": "Samsung",
    "memory": "256 GB",
    "color": "Branco",
    "imageKey": "samsung-galaxy-a36-5g",
    "key": "samsung-galaxy-a36-5g-256gb"
  },
  "SSG GALAXY S948B 256GB VT PPB/P291/14": {
    "family": "Samsung Galaxy S26 Ultra",
    "brand": "Samsung",
    "memory": "256 GB",
    "color": "Violeta",
    "imageKey": "samsung-galaxy-s26-ultra",
    "key": "samsung-galaxy-s26-ultra-256gb"
  },
  "SSG GALAXY A376B 256GB BRPPB/P291/12": {
    "family": "Samsung Galaxy A37 5G",
    "brand": "Samsung",
    "memory": "256 GB",
    "color": "Branco",
    "imageKey": "samsung-galaxy-a37-5g",
    "key": "samsung-galaxy-a37-5g-256gb"
  },
  "SSG GALAXY A576B 256GB AZMPPB/P291/12": {
    "family": "Samsung Galaxy A57 5G",
    "brand": "Samsung",
    "memory": "256 GB",
    "color": "Azul-marinho",
    "imageKey": "samsung-galaxy-a57-5g",
    "key": "samsung-galaxy-a57-5g-256gb"
  }
};

const IMAGE_URLS = {
  "iphone-13": "/regional-images/iphone-13.png",
  "iphone-15": "/regional-images/iphone-15.jpg",
  "iphone-16": "/regional-images/iphone-16.png",
  "iphone-16-pro-max": "/regional-images/iphone-16-pro-max.png",
  "iphone-16e": "/regional-images/iphone-16e.jpg",
  "iphone-17": "/regional-images/iphone-17.png",
  "iphone-17-pro": "/regional-images/iphone-17-pro.png",
  "iphone-17-pro-max": "/regional-images/iphone-17-pro-max.jpg",
  "iphone-17e": "/regional-images/iphone-17e.png",
  "iphone-18-pro": "/regional-images/iphone-18-pro.png",
  "iphone-18-pro-max": "/regional-images/iphone-18-pro-max.png",
  "iphone-air": "/regional-images/iphone-air.png",
  "motorola-edge-60-fusion": "/regional-images/motorola-edge-60-fusion.png",
  "motorola-edge-60-pro": "/regional-images/motorola-edge-60-pro.png",
  "motorola-edge-70": "/regional-images/motorola-edge-70.png",
  "motorola-edge-70-fusion": "/regional-images/motorola-edge-70-fusion.png",
  "motorola-moto-g-max-5g": "/regional-images/motorola-moto-g-max-5g.png",
  "motorola-moto-g06": "/regional-images/motorola-moto-g06.png",
  "motorola-moto-g35-5g": "/regional-images/motorola-moto-g35-5g.png",
  "motorola-moto-g37-5g": "/regional-images/motorola-moto-g37-5g.png",
  "motorola-moto-g47-5g": "/regional-images/motorola-moto-g47-5g.png",
  "motorola-moto-g56-5g": "/regional-images/motorola-moto-g56-5g.png",
  "motorola-moto-g67-5g": "/regional-images/motorola-moto-g67-5g.png",
  "motorola-moto-g77-5g": "/regional-images/motorola-moto-g77-5g.png",
  "motorola-moto-g86-5g": "/regional-images/motorola-moto-g86-5g.png",
  "motorola-signature": "/regional-images/motorola-signature.png",
  "oppo-a5-5g": "/regional-images/oppo-a5-5g.jpg",
  "oppo-a6x-5g": "/regional-images/oppo-a6x-5g.png",
  "oppo-reno16": "/regional-images/oppo-reno16.png",
  "oppo-reno16-f": "/regional-images/oppo-reno16-f.png",
  "samsung-galaxy-a06-5g": "/regional-images/samsung-galaxy-a06-5g.png",
  "samsung-galaxy-a07-4g": "/regional-images/samsung-galaxy-a07-4g.jpg",
  "samsung-galaxy-a07-5g": "/regional-images/samsung-galaxy-a07-5g.png",
  "samsung-galaxy-a16-5g": "/regional-images/samsung-galaxy-a16-5g.jpg",
  "samsung-galaxy-a17-5g": "/regional-images/samsung-galaxy-a17-5g.jpg",
  "samsung-galaxy-a26-5g": "/regional-images/samsung-galaxy-a26-5g.png",
  "samsung-galaxy-a27-5g": "/regional-images/samsung-galaxy-a27-5g.jpg",
  "samsung-galaxy-a36-5g": "/regional-images/samsung-galaxy-a36-5g.webp",
  "samsung-galaxy-a37-5g": "/regional-images/samsung-galaxy-a37-5g.jpg",
  "samsung-galaxy-a56-5g": "/regional-images/samsung-galaxy-a56-5g.jpg",
  "samsung-galaxy-a57-5g": "/regional-images/samsung-galaxy-a57-5g.webp",
  "samsung-galaxy-s25": "/regional-images/samsung-galaxy-s25.jpg",
  "samsung-galaxy-s25-edge": "/regional-images/samsung-galaxy-s25-edge.jpg",
  "samsung-galaxy-s25-fe": "/regional-images/samsung-galaxy-s25-fe.jpg",
  "samsung-galaxy-s25-ultra": "/regional-images/samsung-galaxy-s25-ultra.webp",
  "samsung-galaxy-s26": "/regional-images/samsung-galaxy-s26.jpg",
  "samsung-galaxy-s26-fe": "/regional-images/samsung-galaxy-s26-fe.jpg",
  "samsung-galaxy-s26-plus": "/regional-images/samsung-galaxy-s26-plus.jpg",
  "samsung-galaxy-s26-ultra": "/regional-images/samsung-galaxy-s26-ultra.jpg",
  "samsung-galaxy-z-flip8": "/regional-images/samsung-galaxy-z-flip8.jpg",
  "samsung-galaxy-z-fold8": "/regional-images/samsung-galaxy-z-fold8.jpg",
  "samsung-galaxy-z-fold8-ultra": "/regional-images/samsung-galaxy-z-fold8-ultra.jpg"
};

export function regionalDeviceInfo(item) {
  const known = MODELS[item.model];
  if (known) return { ...known, displayName: `${known.family} ${known.memory}`, imageUrl: IMAGE_URLS[known.imageKey] || '' };
  const raw = String(item.model || '').replace(/\s+/g, ' ').trim();
  const capacity = raw.match(/(\d+)\s*(GB|TB)/i);
  const memory = capacity ? `${capacity[1]} ${capacity[2].toUpperCase()}` : '';
  const normalized = raw.toLowerCase();
  const match = Object.values(MODELS).find(model => (capacity ? raw.slice(0,capacity.index).trim().toLowerCase() : normalized) === model.family.toLowerCase() && model.memory === memory);
  if (match) return { ...match, displayName: `${match.family} ${memory}`, imageUrl: IMAGE_URLS[match.imageKey] || '' };
  const family = capacity ? raw.slice(0, capacity.index).trim() : raw;
  const key = (family + ' ' + memory).toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return { key, family, memory, color: capacity ? raw.slice(capacity.index + capacity[0].length).trim() || 'Não informado' : 'Não informado', brand: /^iphone/i.test(raw) ? 'Apple' : raw.split(' ')[0], displayName: [family,memory].filter(Boolean).join(' '), imageUrl: '' };
}

export function regionalInventoryGroups(items, { search = '', brand = '' } = {}) {
  const normalize = value => String(value).normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  const query = normalize(search).trim();
  const groups = new Map();
  for (const item of items) {
    const info = regionalDeviceInfo(item);
    if (brand && info.brand !== brand) continue;
    const searchable = normalize([info.displayName,info.color,item.model].join(' '));
    const identifiers = normalize([item.material_code,item.imei,item.store].join(' '));
    const matchesName = query.split(/\s+/).every(word => searchable.includes(word));
    const matchesIdentifier = !/\s/.test(query) && identifiers.includes(query);
    if (query && !matchesName && !matchesIdentifier) continue;
    if (!groups.has(info.key)) groups.set(info.key, { key:info.key,name:info.displayName,brand:info.brand,memory:info.memory,imageUrl:info.imageUrl,total:0,stores:{},colors:{},statuses:{} });
    const group = groups.get(info.key);
    group.total++;
    group.stores[item.store] = (group.stores[item.store] || 0) + 1;
    group.colors[info.color] = (group.colors[info.color] || 0) + 1;
    const status = item.status === 'sold' ? 'sold' : item.stock_state || item.status;
    group.statuses[status] = (group.statuses[status] || 0) + 1;
  }
  return [...groups.values()].sort((a,b) => a.name.localeCompare(b.name,'pt-BR',{numeric:true}));
}
