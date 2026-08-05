import matplotlib.pyplot as plt

# 1. Dados extraídos da tabela da Questão 3
# Limites das classes e frequências (número de unidades)
bins = [30, 50, 70, 90, 110, 130, 150]
frequencias = [4, 8, 5, 7, 3, 5]

# Pontos médios de cada classe para plotagem das barras
midpoints = [40, 60, 80, 100, 120, 140]

# 2. Medidas estatísticas obtidas na resolução oficial
media = 87.5
mediana = 86.0
moda = 61.43 # Moda calculada pela fórmula de Czuber

# 3. Plotagem do Histograma
plt.bar(midpoints, frequencias, width=20, edgecolor='black', color='skyblue', alpha=0.7)
plt.xticks(bins) # Define as marcações do eixo x exatamente nos limites das classes

# 4. Adição das linhas mostrando a Assimetria Positiva (Média > Mediana > Moda)
plt.axvline(x=moda, color='red', linestyle='--', linewidth=2, label=f'Moda = {moda:.2f}')
plt.axvline(x=mediana, color='green', linestyle='-', linewidth=2, label=f'Mediana = {mediana:.1f}')
plt.axvline(x=media, color='purple', linestyle='-.', linewidth=2, label=f'Média = {media:.1f}')

# 5. Títulos e rótulos
plt.title('Histograma do Consumo de Energia - Questão 3\nAssimetria e Curtose')
plt.xlabel('Consumo de energia (kWh)')
plt.ylabel('Frequência (unidades)')

# 6. Caixa de texto com as observações obrigatórias (Curtose, Quartis, Percentis)
info_text = (
    "Assimetria Positiva:\n"
    "Média > Mediana > Moda\n\n"
    "Curtose (K ≈ 0.274):\n"
    "Q1 = 60 | Q3 = 110\n"
    "P10 = 46 | P90 = 137.2\n"
    "Distribuição Platicúrtica"
)
# Posicionando a caixa de texto em um espaço vazio do gráfico
plt.text(105, 5, info_text, fontsize=9, bbox=dict(facecolor='white', alpha=0.9, edgecolor='black'))

# Legenda para as linhas de tendência central
plt.legend(loc='upper right')

# Salva a imagem gerada (isso gera a imagem que você visualiza acima)
plt.savefig('histograma_q3.png', bbox_inches='tight')