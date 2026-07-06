import streamlit as st
import requests
from PIL import  Image
import io

st.set_page_config(
    page_title ="Food AI",
    layout= "centered",
)

st.title("Food photograpy generator")
st.markdown("###Pipeline colaborativo de multiplos agentes para geração de fotos profissionais para delivery apps *")

st.write("Adicione sua foto aqui para que possamos transforma la!!!")

st.divider()

DJANGO_API_URL = "http://127.0.0.1:8000/api/generate/"
REGENERATE_URL = "http://127.0.0.1:8000/api/regenerate/"

UPLOAD_FILE = st.file_uploader("suba aqui seu arquivo jpg , jpeg ou png", type=["jpg", "jpeg","png"])
if UPLOAD_FILE is not None:
    image = Image.open(UPLOAD_FILE)
    st.image(image, caption="Sua foto original",use_container_width= True);

    if st.button("Processar imagem com IA"):
       with st.spinner("Pocessando a sua imagem"):
            try:
                img_byte = io.BytesIO()
                image.save(img_byte, format = "JPEG")
                img_byte = img_byte.getvalue()

                files = {'image': (UPLOAD_FILE.name, img_byte, UPLOAD_FILE.type )}
                response = requests.post(DJANGO_API_URL, files=files)
                if response.status_code == 200:
                    data = response.json();
                    
                    st.session_state["thread_id"] = data.get("thread_id")
                    st.session_state["url_image"] = data.get("url_image")
                    st.session_state["analysis"] = data.get("analysis")
                    st.session_state["prompt"] = data.get("prompt")
                    
                    st.success("Imagem aprovada");
                    st.markdown("###Resultado final Food AI");
                    st.image(data.get('url_image'), caption="Imagem Comercial Premium Gerada", use_container_width=True)


                    if st.session_state.get("thread_id"):
                        if st.button("🔁 Gerar nova versão sem reanalisar"):
                            with st.spinner("Gerando nova versão com o mesmo prompt..."):
                                response = requests.post(
                                    REGENERATE_URL,
                                    json={
                                        "thread_id": st.session_state["thread_id"]
                                    },
                                    timeout=600
                                )

                                if response.status_code == 200:
                                    data = response.json()

                                    st.session_state["url_image"] = data.get("url_image")

                                    st.success("Nova versão gerada sem chamar Gemini novamente.")
                                    st.image(
                                        st.session_state["url_image"],
                                        caption="Nova versão gerada",
                                        use_container_width=True
                                    )
                                else:
                                    st.error("Erro ao regenerar imagem")
                                    st.text(response.text)
                else:    
                    data = response.json()
                    erro_msg = data.get('erro', data.get('message', 'Erro desconhecido.'))
            except Exception as e:
                st.error(f"Falha ao conectar com o servidor Django backend: {str(e)}")
                st.info("Certifique-se de que o Django está rodando na porta 8000 (`python manage.py runserver 8000`)")