/**
 * NDV standalone checkout — Netlify Function, direct Stripe REST.
 * No Lovable gateway, no Shopify. Prices are validated server-side from
 * ./data/ndv-prices.json (the client's claimed prices are never trusted).
 *
 * Env: STRIPE_SECRET_KEY (set in Netlify UI → Site settings → Environment variables)
 * Optional: PUBLIC_BASE_URL (defaults to https://ndvluxury.com.au).
 *
 * POST /api/create-checkout-session
 * body: { lines: [{ handle, variantId, quantity }], ndis?: { participantName, ndisNumber, email } }
 * returns: { url } — Stripe Checkout hosted URL (AUD), or 400/500 { error }
 */
// INLINED by scripts/bundle-function.mjs — do not edit by hand.
const pricesData = {
    "ndv-bias-cut-midi-skirt":  {
                                    "variantId":  "52368264102190",
                                    "title":  "NDV Bias-Cut Midi Skirt",
                                    "house":  "Atelier",
                                    "amountCents":  28000,
                                    "currency":  "aud",
                                    "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/skirt-1.jpg?v=1786505693"
                                },
    "ndv-boucle-blazer":  {
                              "variantId":  "52368263938350",
                              "title":  "NDV Boucle Blazer",
                              "house":  "Atelier",
                              "amountCents":  54000,
                              "currency":  "aud",
                              "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/blazer-2.jpg?v=1786505689"
                          },
    "ndv-cashmere-lounge-pant":  {
                                     "variantId":  "52370968805678",
                                     "title":  "NDV Cashmere Lounge Pant",
                                     "house":  "Atelier",
                                     "amountCents":  38000,
                                     "currency":  "aud",
                                     "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/d177da35955c.jpg?v=1785331798"
                                 },
    "ndv-cashmere-hooded-robe":  {
                                     "variantId":  "52368264331566",
                                     "title":  "NDV Cashmere Robe",
                                     "house":  "Atelier",
                                     "amountCents":  58000,
                                     "currency":  "aud",
                                     "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/ndv-cashmere-hooded-robe-1.jpg?v=1786526431"
                                 },
    "ndv-cashmere-travel-set":  {
                                    "variantId":  "52370968838446",
                                    "title":  "NDV Cashmere Travel Set",
                                    "house":  "Atelier",
                                    "amountCents":  62000,
                                    "currency":  "aud",
                                    "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/fadddcae8d1d.jpg?v=1785331804"
                                },
    "ndv-cashmere-turtleneck":  {
                                    "variantId":  "52368263807278",
                                    "title":  "NDV Cashmere Turtleneck",
                                    "house":  "Atelier",
                                    "amountCents":  38000,
                                    "currency":  "aud",
                                    "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/610667c4f15f.jpg?v=1785287119"
                                },
    "ndv-cocoon-wrap-cardigan":  {
                                     "variantId":  "52368263905582",
                                     "title":  "NDV Cocoon Wrap Cardigan",
                                     "house":  "Atelier",
                                     "amountCents":  42000,
                                     "currency":  "aud",
                                     "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/59cf07ffd1f2.jpg?v=1785287126"
                                 },
    "ndv-draped-silk-blouse":  {
                                   "variantId":  "52368264167726",
                                   "title":  "NDV Draped Silk Blouse",
                                   "house":  "Atelier",
                                   "amountCents":  34000,
                                   "currency":  "aud",
                                   "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/blouse-1.jpg?v=1786505696"
                               },
    "ndv-fluid-wide-leg-trouser":  {
                                       "variantId":  "52368263741742",
                                       "title":  "NDV Fluid Wide-Leg Trouser",
                                       "house":  "Atelier",
                                       "amountCents":  32000,
                                       "currency":  "aud",
                                       "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/c7237c86cd4d.jpg?v=1785287113"
                                   },
    "ndv-long-silk-robe":  {
                               "variantId":  "52370968772910",
                               "title":  "NDV Long Silk Robe",
                               "house":  "Atelier",
                               "amountCents":  54000,
                               "currency":  "aud",
                               "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/a32b82756723.jpg?v=1785331794"
                           },
    "ndv-ribbed-knit-midi":  {
                                 "variantId":  "52368264397102",
                                 "title":  "NDV Ribbed Knit Midi",
                                 "house":  "Atelier",
                                 "amountCents":  36000,
                                 "currency":  "aud",
                                 "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/ribbed-1.jpg?v=1786505704"
                             },
    "ndv-seamless-crew-tee":  {
                                  "variantId":  "52368263643438",
                                  "title":  "NDV Seamless Crew Tee",
                                  "house":  "Atelier",
                                  "amountCents":  8900,
                                  "currency":  "aud",
                                  "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/images-EverydaySeamlessTightFitCrewBlackB3B1O_BB2J_4039_V1_1920x_04baf12b-3bf7-4dfe-8fb3-f3db6394617c.webp?v=1786765588"
                              },
    "ndv-silk-camisole":  {
                              "variantId":  "52368263971118",
                              "title":  "NDV Silk Camisole",
                              "house":  "Atelier",
                              "amountCents":  22000,
                              "currency":  "aud",
                              "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/5102aa25a85b.jpg?v=1785287135"
                          },
    "ndv-silk-pyjama-set":  {
                                "variantId":  "52368264298798",
                                "title":  "NDV Silk Pyjama Set",
                                "house":  "Atelier",
                                "amountCents":  32000,
                                "currency":  "aud",
                                "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/7a7ce5a18c66.jpg?v=1785287153"
                            },
    "ndv-silk-slip-dress":  {
                                "variantId":  "52368263610670",
                                "title":  "NDV Silk Slip Dress",
                                "house":  "Atelier",
                                "amountCents":  42000,
                                "currency":  "aud",
                                "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/d712e57b223f.jpg?v=1785287100"
                            },
    "ndv-silk-wrap-dress":  {
                                "variantId":  "52368264364334",
                                "title":  "NDV Silk Wrap Dress",
                                "house":  "Atelier",
                                "amountCents":  46000,
                                "currency":  "aud",
                                "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/wrap-2.jpg?v=1786505700"
                            },
    "ndv-bamboo-high-waist-brief":  {
                                        "variantId":  "52370717770030",
                                        "title":  "NDV Bamboo High-Waist Brief",
                                        "house":  "Intimates",
                                        "amountCents":  4200,
                                        "currency":  "aud",
                                        "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/b472e60c8a9d.jpg?v=1785330186"
                                    },
    "ndv-bamboo-sleep-bra":  {
                                 "variantId":  "52370850775342",
                                 "title":  "NDV Bamboo Sleep Bra",
                                 "house":  "Intimates",
                                 "amountCents":  6800,
                                 "currency":  "aud",
                                 "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/630529b97874.jpg?v=1785330229"
                             },
    "ndv-cotton-silk-brief-5-pack":  {
                                         "variantId":  "52370881544494",
                                         "title":  "NDV Cotton-Silk Brief 5-Pack",
                                         "house":  "Intimates",
                                         "amountCents":  8500,
                                         "currency":  "aud",
                                         "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/fc12269238d4.jpg?v=1785330254"
                                     },
    "ndv-lace-longline-bralette":  {
                                       "variantId":  "52370877940014",
                                       "title":  "NDV Lace Longline Bralette",
                                       "house":  "Intimates",
                                       "amountCents":  10500,
                                       "currency":  "aud",
                                       "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/45b18c31e5b5.jpg?v=1785330249"
                                   },
    "ndv-lace-triangle-bralette":  {
                                       "variantId":  "52370743230766",
                                       "title":  "NDV Lace Triangle Bralette",
                                       "house":  "Intimates",
                                       "amountCents":  8800,
                                       "currency":  "aud",
                                       "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/f6235781bd60.jpg?v=1785330193"
                                   },
    "ndv-mesh-bodysuit":  {
                              "variantId":  "52370863522094",
                              "title":  "NDV Mesh Bodysuit",
                              "house":  "Intimates",
                              "amountCents":  11000,
                              "currency":  "aud",
                              "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/9389ce1e683f.jpg?v=1785330236"
                          },
    "ndv-modal-boyshort":  {
                               "variantId":  "52370771444014",
                               "title":  "NDV Modal Boyshort",
                               "house":  "Intimates",
                               "amountCents":  4500,
                               "currency":  "aud",
                               "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/0fc8ad85565f.jpg?v=1785330200"
                           },
    "ndv-seamless-nursing-bra":  {
                                     "variantId":  "52370898813230",
                                     "title":  "NDV Seamless Nursing Bra",
                                     "house":  "Intimates",
                                     "amountCents":  7800,
                                     "currency":  "aud",
                                     "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/4215fd46408b.jpg?v=1785330270"
                                 },
    "ndv-seamless-soft-cup-bra":  {
                                      "variantId":  "52370673533230",
                                      "title":  "NDV Seamless Soft-Cup Bra",
                                      "house":  "Intimates",
                                      "amountCents":  7800,
                                      "currency":  "aud",
                                      "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/05a148a2e2ef.jpg?v=1785330176"
                                  },
    "ndv-seamless-thong-3-pack":  {
                                      "variantId":  "52370822136110",
                                      "title":  "NDV Seamless Thong 3-Pack",
                                      "house":  "Intimates",
                                      "amountCents":  5500,
                                      "currency":  "aud",
                                      "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/bed8d938f11c.jpg?v=1785330216"
                                  },
    "ndv-silk-chemise":  {
                             "variantId":  "52370792907054",
                             "title":  "NDV Silk Chemise",
                             "house":  "Intimates",
                             "amountCents":  16500,
                             "currency":  "aud",
                             "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/bef8e4f57f5e.jpg?v=1785330206"
                         },
    "ndv-silk-french-knicker":  {
                                    "variantId":  "52370704924974",
                                    "title":  "NDV Silk French Knicker",
                                    "house":  "Intimates",
                                    "amountCents":  6800,
                                    "currency":  "aud",
                                    "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/fcd5236a1178.jpg?v=1785330183"
                                },
    "ndv-silk-garter-set":  {
                                "variantId":  "52370836160814",
                                "title":  "NDV Silk Garter Set",
                                "house":  "Intimates",
                                "amountCents":  12500,
                                "currency":  "aud",
                                "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/3b478e7ee17a.jpg?v=1785330223"
                            },
    "ndv-silk-pyjama-short-set":  {
                                      "variantId":  "52370940559662",
                                      "title":  "NDV Silk Pyjama Short Set",
                                      "house":  "Intimates",
                                      "amountCents":  15500,
                                      "currency":  "aud",
                                      "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/a90084c8903d.jpg?v=1785330531"
                                  },
    "ndv-silk-robe-short":  {
                                "variantId":  "52370887672110",
                                "title":  "NDV Silk Robe Short",
                                "house":  "Intimates",
                                "amountCents":  14500,
                                "currency":  "aud",
                                "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/32f6127bee1d.jpg?v=1785330259"
                            },
    "ndv-silk-sleep-mask":  {
                                "variantId":  "52370901729582",
                                "title":  "NDV Silk Sleep Mask",
                                "house":  "Intimates",
                                "amountCents":  4500,
                                "currency":  "aud",
                                "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/05a148a2e2ef_76619906-0edb-4a66-abae-6d0ad1324e0c.jpg?v=1785330273"
                            },
    "ndv-silk-tap-short":  {
                               "variantId":  "52370872860974",
                               "title":  "NDV Silk Tap Short",
                               "house":  "Intimates",
                               "amountCents":  7500,
                               "currency":  "aud",
                               "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/ndv-silk-tap-short.webp?v=1786506079"
                           },
    "ndv-wireless-lace-bra":  {
                                  "variantId":  "52370810241326",
                                  "title":  "NDV Wireless Lace Bra",
                                  "house":  "Intimates",
                                  "amountCents":  9800,
                                  "currency":  "aud",
                                  "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/22d18fdf758f.jpg?v=1785330212"
                              },
    "ndv-wireless-silk-bralette":  {
                                       "variantId":  "52368264429870",
                                       "title":  "NDV Wireless Silk Bralette",
                                       "house":  "Intimates",
                                       "amountCents":  9500,
                                       "currency":  "aud",
                                       "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/207ba1c2c7f9.jpg?v=1785287174"
                                   },
    "ndv-wireless-t-shirt-bra":  {
                                     "variantId":  "52370894094638",
                                     "title":  "NDV Wireless T-Shirt Bra",
                                     "house":  "Intimates",
                                     "amountCents":  8800,
                                     "currency":  "aud",
                                     "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/537f60b96ea4.jpg?v=1785330266"
                                 },
    "ndv-brushed-gold-watch":  {
                                   "variantId":  "52370968609070",
                                   "title":  "NDV Brushed Gold Watch",
                                   "house":  "Objects \u0026 Adornment",
                                   "amountCents":  28500,
                                   "currency":  "aud",
                                   "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/gold-watch.jpg?v=1786508802"
                               },
    "ndv-ceramic-incense-holder":  {
                                       "variantId":  "52370968641838",
                                       "title":  "NDV Ceramic Incense Holder",
                                       "house":  "Objects \u0026 Adornment",
                                       "amountCents":  8500,
                                       "currency":  "aud",
                                       "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/incense-holder.jpg?v=1786508804"
                                   },
    "ndv-fidget-chain-bracelet":  {
                                      "variantId":  "52370965135662",
                                      "title":  "NDV Fidget Chain Bracelet",
                                      "house":  "Objects \u0026 Adornment",
                                      "amountCents":  8500,
                                      "currency":  "aud",
                                      "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/fidget-chain-bracelet.jpg?v=1786508780"
                                  },
    "ndv-fidget-ring-gold":  {
                                 "variantId":  "52370964775214",
                                 "title":  "NDV Fidget Ring Gold",
                                 "house":  "Objects \u0026 Adornment",
                                 "amountCents":  14500,
                                 "currency":  "aud",
                                 "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/fidget-ring.jpg?v=1786508771"
                             },
    "ndv-fidget-stud-earrings":  {
                                     "variantId":  "52370965496110",
                                     "title":  "NDV Fidget Stud Earrings",
                                     "house":  "Objects \u0026 Adornment",
                                     "amountCents":  8500,
                                     "currency":  "aud",
                                     "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/stud-earrings.jpg?v=1786508793"
                                 },
    "ndv-matte-phone-sleeve":  {
                                   "variantId":  "52370968740142",
                                   "title":  "NDV Matte Phone Sleeve",
                                   "house":  "Objects \u0026 Adornment",
                                   "amountCents":  6500,
                                   "currency":  "aud",
                                   "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/phone-sleeve.jpg?v=1786508809"
                               },
    "ndv-rose-quartz-roller":  {
                                   "variantId":  "52370968543534",
                                   "title":  "NDV Rose Quartz Roller",
                                   "house":  "Objects \u0026 Adornment",
                                   "amountCents":  6500,
                                   "currency":  "aud",
                                   "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/rose-quartz-roller.jpg?v=1786508797"
                               },
    "ndv-signet-pin-ring":  {
                                "variantId":  "52370965168430",
                                "title":  "NDV Signet Pin Ring",
                                "house":  "Objects \u0026 Adornment",
                                "amountCents":  13500,
                                "currency":  "aud",
                                "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/signet-ring.jpg?v=1786508782"
                            },
    "ndv-silk-eye-compress":  {
                                  "variantId":  "52370968281390",
                                  "title":  "NDV Silk Eye Compress",
                                  "house":  "Objects \u0026 Adornment",
                                  "amountCents":  5500,
                                  "currency":  "aud",
                                  "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/silk-eye-mask.jpg?v=1786508795"
                              },
    "ndv-silk-hair-ribbon-set":  {
                                     "variantId":  "52370968674606",
                                     "title":  "NDV Silk Hair Ribbon Set",
                                     "house":  "Objects \u0026 Adornment",
                                     "amountCents":  5500,
                                     "currency":  "aud",
                                     "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/silk-ribbon.jpg?v=1786508807"
                                 },
    "ndv-silk-cord-necklace":  {
                                   "variantId":  "52370965201198",
                                   "title":  "NDV Silk-Cord Necklace",
                                   "house":  "Objects \u0026 Adornment",
                                   "amountCents":  7500,
                                   "currency":  "aud",
                                   "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/silk-cord-necklace.jpg?v=1786508785"
                               },
    "ndv-spinner-pendant-necklace":  {
                                         "variantId":  "52370964807982",
                                         "title":  "NDV Spinner Pendant Necklace",
                                         "house":  "Objects \u0026 Adornment",
                                         "amountCents":  12500,
                                         "currency":  "aud",
                                         "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/spinner-pendant.jpg?v=1786508773"
                                     },
    "ndv-tactile-cuff-bracelet":  {
                                      "variantId":  "52370965365038",
                                      "title":  "NDV Tactile Cuff Bracelet",
                                      "house":  "Objects \u0026 Adornment",
                                      "amountCents":  11500,
                                      "currency":  "aud",
                                      "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/cuff-bracelet.jpg?v=1786508787"
                                  },
    "ndv-textured-hoop-earrings":  {
                                       "variantId":  "52370965102894",
                                       "title":  "NDV Textured Hoop Earrings",
                                       "house":  "Objects \u0026 Adornment",
                                       "amountCents":  9500,
                                       "currency":  "aud",
                                       "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/hoop-earrings.jpg?v=1786508778"
                                   },
    "ndv-weighted-bracelet":  {
                                  "variantId":  "52370964840750",
                                  "title":  "NDV Weighted Bracelet",
                                  "house":  "Objects \u0026 Adornment",
                                  "amountCents":  18500,
                                  "currency":  "aud",
                                  "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/weighted-bracelet.jpg?v=1786508776"
                              },
    "ndv-weighted-palm-stone":  {
                                    "variantId":  "52370968576302",
                                    "title":  "NDV Weighted Palm Stone",
                                    "house":  "Objects \u0026 Adornment",
                                    "amountCents":  4500,
                                    "currency":  "aud",
                                    "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/palm-stone.jpg?v=1786508800"
                                },
    "ndv-worry-bead-necklace":  {
                                    "variantId":  "52370965430574",
                                    "title":  "NDV Worry-Bead Necklace",
                                    "house":  "Objects \u0026 Adornment",
                                    "amountCents":  6800,
                                    "currency":  "aud",
                                    "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/worry-bead-necklace.jpg?v=1786508790"
                                },
    "ndv-bamboo-duvet-cover":  {
                                   "variantId":  "52370964218158",
                                   "title":  "NDV Bamboo Duvet Cover",
                                   "house":  "Sanctuary Bedding",
                                   "amountCents":  24500,
                                   "currency":  "aud",
                                   "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/83792059edab.jpg?v=1785331384"
                               },
    "ndv-bamboo-pillowcase-pair":  {
                                       "variantId":  "52370964578606",
                                       "title":  "NDV Bamboo Pillowcase Pair",
                                       "house":  "Sanctuary Bedding",
                                       "amountCents":  7500,
                                       "currency":  "aud",
                                       "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/62ca94c8bd75.jpg?v=1785331413"
                                   },
    "ndv-bamboo-sheet-set":  {
                                 "variantId":  "52370964021550",
                                 "title":  "NDV Bamboo Sheet Set",
                                 "house":  "Sanctuary Bedding",
                                 "amountCents":  19500,
                                 "currency":  "aud",
                                 "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/f17f996d3a3e.jpg?v=1785331377"
                             },
    "ndv-boucle-body-pillow":  {
                                   "variantId":  "52370964054318",
                                   "title":  "NDV Bouclé Body Pillow",
                                   "house":  "Sanctuary Bedding",
                                   "amountCents":  16500,
                                   "currency":  "aud",
                                   "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/ndv-boucle-body-pillow.jpg?v=1786506766"
                               },
    "ndv-cashmere-bed-socks":  {
                                   "variantId":  "52370964611374",
                                   "title":  "NDV Cashmere Bed Socks",
                                   "house":  "Sanctuary Bedding",
                                   "amountCents":  8500,
                                   "currency":  "aud",
                                   "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/ndv-cashmere-bed-socks.jpg?v=1786506778"
                               },
    "ndv-sensory-cocoon-throw":  {
                                     "variantId":  "52370964480302",
                                     "title":  "NDV Sensory Cocoon Throw",
                                     "house":  "Sanctuary Bedding",
                                     "amountCents":  22500,
                                     "currency":  "aud",
                                     "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/ndv-sensory-cocoon-throw.jpg?v=1786506771"
                                 },
    "ndv-silk-bolster-cushion":  {
                                     "variantId":  "52370964381998",
                                     "title":  "NDV Silk Bolster Cushion",
                                     "house":  "Sanctuary Bedding",
                                     "amountCents":  13500,
                                     "currency":  "aud",
                                     "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/ndv-silk-bolster-cushion.jpg?v=1786506769"
                                 },
    "ndv-silk-duvet-cover":  {
                                 "variantId":  "52370963562798",
                                 "title":  "NDV Silk Duvet Cover",
                                 "house":  "Sanctuary Bedding",
                                 "amountCents":  42500,
                                 "currency":  "aud",
                                 "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/db0553d5f97e.jpg?v=1785331371"
                             },
    "ndv-silk-fitted-sheet":  {
                                  "variantId":  "52370942853422",
                                  "title":  "NDV Silk Fitted Sheet",
                                  "house":  "Sanctuary Bedding",
                                  "amountCents":  28500,
                                  "currency":  "aud",
                                  "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/4e5ca04f43a4.jpg?v=1785330631"
                              },
    "ndv-silk-flat-sheet":  {
                                "variantId":  "52370942886190",
                                "title":  "NDV Silk Flat Sheet",
                                "house":  "Sanctuary Bedding",
                                "amountCents":  24500,
                                "currency":  "aud",
                                "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/5eb7b1f54910.jpg?v=1785330638"
                            },
    "ndv-silk-pillow-set":  {
                                "variantId":  "52370964513070",
                                "title":  "NDV Silk Pillow Set",
                                "house":  "Sanctuary Bedding",
                                "amountCents":  28500,
                                "currency":  "aud",
                                "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/ndv-silk-pillow-set.jpg?v=1786506773"
                            },
    "ndv-silk-pillowcase-duo":  {
                                    "variantId":  "52370942820654",
                                    "title":  "NDV Silk Pillowcase Duo",
                                    "house":  "Sanctuary Bedding",
                                    "amountCents":  9500,
                                    "currency":  "aud",
                                    "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/11718e6cfbc9.jpg?v=1785330629"
                                },
    "ndv-weighted-blanket-7kg":  {
                                     "variantId":  "52370941575470",
                                     "title":  "NDV Weighted Blanket 7kg",
                                     "house":  "Sanctuary Bedding",
                                     "amountCents":  28500,
                                     "currency":  "aud",
                                     "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/44f823e9a917.jpg?v=1785330620"
                                 },
    "ndv-weighted-blanket-9kg":  {
                                     "variantId":  "52370942787886",
                                     "title":  "NDV Weighted Blanket 9kg",
                                     "house":  "Sanctuary Bedding",
                                     "amountCents":  34500,
                                     "currency":  "aud",
                                     "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/d7603b22fafb.jpg?v=1785330625"
                                 },
    "ndv-weighted-shoulder-wrap":  {
                                       "variantId":  "52370964545838",
                                       "title":  "NDV Weighted Shoulder Wrap",
                                       "house":  "Sanctuary Bedding",
                                       "amountCents":  14500,
                                       "currency":  "aud",
                                       "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/ndv-weighted-shoulder-wrap.jpg?v=1786506775"
                                   },
    "ndv-back-smoothing-bodysuit":  {
                                        "variantId":  "52370941182254",
                                        "title":  "NDV Back-Smoothing Bodysuit",
                                        "house":  "Second Skin",
                                        "amountCents":  19500,
                                        "currency":  "aud",
                                        "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/1005f6a0d985.jpg?v=1785330578"
                                    },
    "ndv-compression-camisole":  {
                                     "variantId":  "52370941378862",
                                     "title":  "NDV Compression Camisole",
                                     "house":  "Second Skin",
                                     "amountCents":  11500,
                                     "currency":  "aud",
                                     "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/36faf9b1cdde.jpg?v=1785330590"
                                 },
    "ndv-contour-midi-skirt":  {
                                   "variantId":  "52370941477166",
                                   "title":  "NDV Contour Midi Skirt",
                                   "house":  "Second Skin",
                                   "amountCents":  14500,
                                   "currency":  "aud",
                                   "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/c083d2bc3a24.jpg?v=1785330609"
                               },
    "ndv-contour-slip":  {
                             "variantId":  "52370940821806",
                             "title":  "NDV Contour Slip",
                             "house":  "Second Skin",
                             "amountCents":  14500,
                             "currency":  "aud",
                             "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/731b001b90c8.jpg?v=1785330565"
                         },
    "ndv-high-waist-sculpt-brief":  {
                                        "variantId":  "52370936463662",
                                        "title":  "NDV High-Waist Sculpt Brief",
                                        "house":  "Second Skin",
                                        "amountCents":  9500,
                                        "currency":  "aud",
                                        "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/ndv-high-waist-sculpt-brief.jpg?v=1786506277"
                                    },
    "ndv-long-leg-shaping-short":  {
                                       "variantId":  "52370940690734",
                                       "title":  "NDV Long-Leg Shaping Short",
                                       "house":  "Second Skin",
                                       "amountCents":  11500,
                                       "currency":  "aud",
                                       "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/67831413df78.jpg?v=1785330552"
                                   },
    "ndv-open-bust-bodysuit":  {
                                   "variantId":  "52370940625198",
                                   "title":  "NDV Open-Bust Bodysuit",
                                   "house":  "Second Skin",
                                   "amountCents":  16500,
                                   "currency":  "aud",
                                   "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/571c71caa6aa.jpg?v=1785330544"
                               },
    "ndv-sculpt-thong-bodysuit":  {
                                      "variantId":  "52370941411630",
                                      "title":  "NDV Sculpt Thong Bodysuit",
                                      "house":  "Second Skin",
                                      "amountCents":  15500,
                                      "currency":  "aud",
                                      "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/107c478aec56.jpg?v=1785330596"
                                  },
    "ndv-sculpting-long-sleeve":  {
                                      "variantId":  "52370941509934",
                                      "title":  "NDV Sculpting Long Sleeve",
                                      "house":  "Second Skin",
                                      "amountCents":  18500,
                                      "currency":  "aud",
                                      "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/ad466ccb300b.jpg?v=1785330617"
                                  },
    "ndv-seamless-bike-short":  {
                                    "variantId":  "52370940854574",
                                    "title":  "NDV Seamless Bike Short",
                                    "house":  "Second Skin",
                                    "amountCents":  8500,
                                    "currency":  "aud",
                                    "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/04dcc722b087.jpg?v=1785330572"
                                },
    "ndv-seamless-mid-thigh-short":  {
                                         "variantId":  "52370940592430",
                                         "title":  "NDV Seamless Mid-Thigh Short",
                                         "house":  "Second Skin",
                                         "amountCents":  10500,
                                         "currency":  "aud",
                                         "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/cb54acc36ddd.jpg?v=1785330538"
                                     },
    "ndv-seamless-shaping-tank":  {
                                      "variantId":  "52370940789038",
                                      "title":  "NDV Seamless Shaping Tank",
                                      "house":  "Second Skin",
                                      "amountCents":  9500,
                                      "currency":  "aud",
                                      "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/c3d903fa3ca3.jpg?v=1785330559"
                                  },
    "ndv-seamless-slip-dress":  {
                                    "variantId":  "52370940657966",
                                    "title":  "NDV Seamless Slip Dress",
                                    "house":  "Second Skin",
                                    "amountCents":  17500,
                                    "currency":  "aud",
                                    "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/7f6a4a6af3c5.jpg?v=1785330550"
                                },
    "ndv-shaping-half-slip":  {
                                  "variantId":  "52370941247790",
                                  "title":  "NDV Shaping Half-Slip",
                                  "house":  "Second Skin",
                                  "amountCents":  12500,
                                  "currency":  "aud",
                                  "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/63172a2d964a.jpg?v=1785330584"
                              },
    "ndv-shaping-turtleneck":  {
                                   "variantId":  "52370941444398",
                                   "title":  "NDV Shaping Turtleneck",
                                   "house":  "Second Skin",
                                   "amountCents":  17500,
                                   "currency":  "aud",
                                   "image":  "https://cdn.shopify.com/s/files/1/0992/8654/8782/files/ef037be189cd.jpg?v=1785330602"
                               }
};

// Bundled JSON import (inlined by esbuild at deploy time).
const PRICES = pricesData;

const BASE_URL = process.env.PUBLIC_BASE_URL ?? "https://ndvluxury.com.au";

const json = (status, body) => new Response(JSON.stringify(body), {
  status,
  headers: { "Content-Type": "application/json" },
});

export default async (req) => {
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return json(503, {
      error: "Checkout is not configured yet: STRIPE_SECRET_KEY is not set. Add it in Netlify → Site settings → Environment variables.",
    });
  }

  let body;
  try { body = await req.json(); } catch { return json(400, { error: "Invalid JSON body" }); }

  const lines = Array.isArray(body?.lines) ? body.lines : [];
  if (lines.length === 0) return json(400, { error: "Your selection is empty" });
  if (lines.length > 50) return json(400, { error: "Too many items in one order" });

  const form = new URLSearchParams();
  form.set("mode", "payment");
  form.set("success_url", `${BASE_URL}/thank-you?session_id={CHECKOUT_SESSION_ID}`);
  form.set("cancel_url", `${BASE_URL}/cart`);
  form.set("billing_address_collection", "required");
  // Shipping: flat-rate options; collected address required for dropship fulfilment.
  form.set("shipping_address_collection[allowed_countries][0]", "AU");
  form.set("shipping_address_collection[allowed_countries][1]", "NZ");
  form.set("shipping_address_collection[allowed_countries][2]", "US");
  form.set("shipping_address_collection[allowed_countries][3]", "GB");
  form.set("shipping_address_collection[allowed_countries][4]", "CA");
  form.set("shipping_options[0][shipping_rate_data][type]", "fixed_amount");
  form.set("shipping_options[0][shipping_rate_data][display_name]", "Express (7–14 days)");
  form.set("shipping_options[0][shipping_rate_data][fixed_amount][amount]", "1500");
  form.set("shipping_options[0][shipping_rate_data][fixed_amount][currency]", "aud");
  form.set("shipping_options[0][shipping_rate_data][delivery_estimate][minimum][unit]", "business_day");
  form.set("shipping_options[0][shipping_rate_data][delivery_estimate][minimum][value]", "7");
  form.set("shipping_options[0][shipping_rate_data][delivery_estimate][maximum][unit]", "business_day");
  form.set("shipping_options[0][shipping_rate_data][delivery_estimate][maximum][value]", "14");
  form.set("metadata[channel]", "ndv_standalone");
  form.set("metadata[platform]", "netlify");

  let i = 0;
  const normId = (v) => String(v).replace(/^.*\//, ""); // strips gid://shopify/ProductVariant/
  for (const line of lines) {
    const entry = PRICES[line.handle];
    if (!entry) return json(400, { error: `Unknown product: ${line.handle}` });
    if (normId(entry.variantId) !== normId(line.variantId)) return json(400, { error: `Variant mismatch: ${line.handle}` });
    if (entry.amountCents == null) return json(400, { error: `${entry.title} has no published price yet` });
    const qty = Math.floor(Number(line.quantity));
    if (!Number.isInteger(qty) || qty < 1 || qty > 20) return json(400, { error: "Quantity must be between 1 and 20" });
    form.set(`line_items[${i}][quantity]`, String(qty));
    form.set(`line_items[${i}][price_data][currency]`, "aud");
    form.set(`line_items[${i}][price_data][unit_amount]`, String(entry.amountCents));
    form.set(`line_items[${i}][price_data][product_data][name]`, entry.title);
    if (entry.house) form.set(`line_items[${i}][price_data][product_data][description]`, `House: ${entry.house}`);
    if (entry.image) form.set(`line_items[${i}][price_data][product_data][images][0]`, entry.image);
    i++;
  }

  if (body.ndis && typeof body.ndis.participantName === "string") {
    form.set("metadata[ndis_invoice]", "true");
    form.set("metadata[ndis_participant]", body.ndis.participantName.slice(0, 120));
    form.set("metadata[ndis_number]", String(body.ndis.ndisNumber ?? "not-provided").slice(0, 60));
    form.set("metadata[ndis_email]", String(body.ndis.email ?? "not-provided").slice(0, 160));
  }

  try {
    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error("Stripe error:", JSON.stringify(data));
      return json(502, { error: data?.error?.message ?? "Stripe checkout failed" });
    }
    return json(200, { url: data.url, sessionId: data.id });
  } catch (err) {
    console.error("checkout failure:", err);
    return json(500, { error: "Checkout service unavailable" });
  }
};

export const config = { path: "/api/create-checkout-session" };
