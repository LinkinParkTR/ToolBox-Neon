
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Yalnızca POST isteği kabul edilir." })
    };
  }

  try {
    const { image } = JSON.parse(event.body || "{}");
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error("OPENAI_API_KEY ayarlanmamış.");
    }

    if (!image || !image.startsWith("data:image/")) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Geçerli bir ürün fotoğrafı gerekli." })
      };
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [{
          role: "user",
          content: [
            {
              type: "input_text",
              text: "Fotoğraftaki ürünü Türkçe analiz et. Ürün adını, okunabilen içerik maddelerini, üretim yöntemi hakkında etikette yazan bilgileri ve son kullanma tarihini belirt. Okunmayan bilgileri tahmin etme; belirtilmemişse belirtilmemiş yaz."
            },
            {
              type: "input_image",
              image_url: image
            }
          ]
        }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({
          error: data.error?.message || "Yapay zekâ isteği başarısız oldu."
        })
      };
    }

    const result = (data.output || [])
      .flatMap(item => item.content || [])
      .filter(item => item.type === "output_text")
      .map(item => item.text)
      .join("\n");

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ result })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || "Bir hata oluştu." })
    };
  }
};

