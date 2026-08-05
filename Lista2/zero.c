#include <stdio.h>
#include <stdlib.h>
#include <math.h>
#include <string.h>

double f(double x)
{
    return (sqrt(x) - 5) * exp(-x);
}

double g(double x)
{
    return (0.5 / sqrt(x)) * exp(-x) - (sqrt(x) - 5) * exp(-x);
}

void bissecao(double a, double b, double erro)
{
    double x_meio;
    int iteracoes = 0;

    printf("*** Metodo da Bissecao ***\n");
    printf("Error: %e\n", erro);
    printf("Intervalo: (%f, %f)\n", a, b);
    printf("fx(a = %.16f) = %.16f\n", a, f(a));
    printf("fx(b = %.16f) = %.16f\n", b, f(b));
    printf("Informacao da derivada:\n");
    printf("gx(a = %.16f) = %.16f\n", a, g(a));
    printf("gx(b = %.16f) = %.16f\n", b, g(b));

    if (f(a) * f(b) > 0)
    {
        printf("Nao e possivel garantir raiz neste intervalo.\n");
        return;
    }

    printf("TEM RAIZ REAL <-*********\n");

    while ((b - a) / 2.0 > erro)
    {
        x_meio = (a + b) / 2.0;
        if (f(x_meio) == 0.0)
            break;

        if (f(a) * f(x_meio) < 0)
        {
            b = x_meio;
        }
        else
        {
            a = x_meio;
        }
        iteracoes++;
    }

    x_meio = (a + b) / 2.0;
    printf("Valor de x e %.16f\n", x_meio);
    printf("passos de iteracao %d\n", iteracoes);
}

void secante(double x0, double x1, double erro)
{
    double x2;
    int iteracoes = 0;

    printf("*** Metodo da Secante ***\n");
    printf("Error: %e\n", erro);

    if (f(x0) * f(x1) <= 0)
    {
        printf("TEM RAIZ REAL <-*********\n");
    }

    while (fabs(x1 - x0) > erro)
    {
        if (fabs(f(x1) - f(x0)) < 1e-15)
        {
            printf("Erro: Divisao por zero.\n");
            return;
        }
        x2 = x1 - (f(x1) * (x1 - x0)) / (f(x1) - f(x0));
        x0 = x1;
        x1 = x2;
        iteracoes++;
    }

    printf("Valor de x e %.16f\n", x1);
    printf("passos de iteracao %d\n", iteracoes);
}

int main(int argc, char *argv[])
{
    if (argc != 5)
    {
        printf("Uso: %s <bs|sc> <erro> <a> <b>\n", argv[0]);
        return 1;
    }

    char *metodo = argv[1];
    double erro = atof(argv[2]);
    double a = atof(argv[3]);
    double b = atof(argv[4]);

    printf("Zero da funcao\n");
    printf("metodos implementados em C\n");
    printf("Metodo: %s\n", metodo);
    printf("Refinamento e criterio de parada: %s\n", argv[2]);
    printf("x(0) ou a=%.16f\n", a);
    printf("x(1) ou b=%.16f\n", b);

    if (strcmp(metodo, "bs") == 0)
    {
        bissecao(a, b, erro);
    }
    else if (strcmp(metodo, "sc") == 0)
    {
        secante(a, b, erro);
    }
    else
    {
        printf("Metodo invalido.\n");
    }

    return 0;
}

// No teste da função "a" com o método da Secante no intervalo [0,1], o
// programa apresentou a saída "Erro: Divisao por zero" e não convergiu.

// Isso acontece porque durante as iteraçoes os valores de f(x1) e f(x0)
// ficaram extremamente próximos (diferença menor que a tolerância de 1e-15).
// Como a fórmula da Secante divide por (f(x1) - f(x0)), o denominador se
// aproximou de zero. Isso significa que a reta secante
// ficou quase horizontal, impossibilitando cruzar o eixo x para encontrar
// a próxima aproximação. O método da Bisseção, por ser um método fechado,
// não sofreu desse problema e conseguiu encontrar o valor no mesmo intervalo.