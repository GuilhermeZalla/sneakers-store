<?php

return [
    'required' => 'O campo :attribute é obrigatório.',
    'string' => 'O campo :attribute deve ser um texto.',
    'email' => 'O campo :attribute deve ser um e-mail válido.',
    'unique' => 'O campo :attribute já está em uso.',
    'confirmed' => 'A confirmação do campo :attribute não confere.',
    'current_password' => 'A senha atual está incorreta.',
    'date' => 'O campo :attribute deve ser uma data válida.',
    'date_format' => 'O campo :attribute deve estar no formato :format.',
    'before_or_equal' => 'O campo :attribute deve ser uma data anterior ou igual a :date.',
    'in' => 'O valor selecionado para :attribute é inválido.',
    'regex' => 'O formato do campo :attribute é inválido.',
    'integer' => 'O campo :attribute deve ser um número inteiro.',
    'boolean' => 'O campo :attribute deve ser verdadeiro ou falso.',
    'array' => 'O campo :attribute deve ser uma lista.',
    'exists' => 'O valor selecionado para :attribute é inválido.',
    'gte' => [
        'numeric' => 'O campo :attribute deve ser maior ou igual a :value.',
    ],
    'max' => [
        'string' => 'O campo :attribute não pode ter mais de :max caracteres.',
        'numeric' => 'O campo :attribute não pode ser maior que :max.',
        'array' => 'O campo :attribute não pode ter mais de :max itens.',
    ],
    'min' => [
        'string' => 'O campo :attribute deve ter pelo menos :min caracteres.',
        'numeric' => 'O campo :attribute deve ser pelo menos :min.',
        'array' => 'O campo :attribute deve ter pelo menos :min itens.',
    ],
    'attributes' => [
        'name' => 'nome', 'email' => 'e-mail', 'password' => 'senha',
        'phone' => 'telefone', 'birthday' => 'data de nascimento',
        'second_contact' => 'telefone secundário', 'gender' => 'gênero',
        'current_password' => 'senha atual',
        'product_id' => 'produto', 'quantity' => 'quantidade',
        'min_price' => 'preço mínimo', 'max_price' => 'preço máximo',
        'postal_code' => 'CEP', 'street' => 'rua', 'number' => 'número',
        'complement' => 'complemento', 'reference' => 'referência',
        'district' => 'bairro', 'city' => 'cidade', 'state' => 'estado',
        'type' => 'tipo', 'is_default' => 'endereço padrão',
    ],
];
