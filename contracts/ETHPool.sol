// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

contract ETHPool {
    //state variable
    uint256 public ultimaFechaRecompensa;
    uint256 public totalRecompensa;
    uint256 public totalDepositosUsuarios;

    struct detalleUsuario {
        uint256 deposito;
        uint256 fechaDeposito;
    }

    mapping(address => detalleUsuario) public usuarios;

    mapping(address => bool) public usuariosEquipo;

    //event
    event DepositoGananciasEquipo(
        address _from,
        uint256 _valor,
        uint256 _fecha
    );
    event DepositoEthUsuario(address _from, uint256 _valor, uint256 _fecha);
    event RetirarGanancias(address _from, uint256 _valor, uint256 _fecha);

    //modifier
    modifier soloEquipo() {
        require(
            usuariosEquipo[msg.sender] == true,
            "Funcion exclusiva del equipo"
        );
        _;
    }

    //constructor
    constructor() {
        ultimaFechaRecompensa = block.timestamp;
        usuariosEquipo[msg.sender] = true;
    }

    //funtion
    function depositarGananciasEquipo() public payable soloEquipo {
        require(
            block.timestamp > (ultimaFechaRecompensa + 1 weeks),
            "No ha pasado una semana!"
        );
        
        totalRecompensa += msg.value;
        ultimaFechaRecompensa = block.timestamp;
        emit DepositoGananciasEquipo(
            msg.sender,
            msg.value,
            block.timestamp
        );
    }

    function depositarEthUsuario() public payable {
      
        usuarios[msg.sender].deposito += msg.value;
        usuarios[msg.sender].fechaDeposito = block.timestamp;

        totalDepositosUsuarios += msg.value;

        emit DepositoEthUsuario(msg.sender, msg.value,  block.timestamp);
    }

    function retirarDepositoMasGanancias() public {
      
        require(
            usuarios[msg.sender].deposito > 0,
            "EL usuarion no a depositado"
        );

        if (usuarios[msg.sender].fechaDeposito < ultimaFechaRecompensa) {
            uint256 porcentajePool = (usuarios[msg.sender].deposito * 1 ether) /
                totalDepositosUsuarios;

            uint256 ganaciasMasDeposito = usuarios[msg.sender].deposito +
                (totalRecompensa * porcentajePool) /
                1 ether;

            totalDepositosUsuarios -= usuarios[msg.sender].deposito;

            totalRecompensa =
                totalRecompensa -
                (totalRecompensa * porcentajePool) /
                1 ether;

            usuarios[msg.sender].deposito = 0;

            (bool success, ) = payable(msg.sender).call{
                value: ganaciasMasDeposito
            }("");

            require(success, "Transfer failed");

            emit RetirarGanancias(
                msg.sender,
                ganaciasMasDeposito,
                block.timestamp
            );
        } else {
            (bool success, ) = payable(msg.sender).call{
                value: usuarios[msg.sender].deposito
            }("");

            require(success, "Transfer failed");
        }
    }
}
