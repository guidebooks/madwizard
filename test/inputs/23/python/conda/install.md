# Conda: Installation

--8<-- "what-is-conda.md"

## Choose a Conda Installation Method

The fastest way to obtain conda is to install Miniconda, a mini
version of Anaconda that includes only conda and its dependencies. If
you prefer to have conda plus over 7,500 open-source packages, install
Anaconda.

=== "Install Miniconda"
    Miniconda is a free minimal installer for conda. It is a small, bootstrap version of Anaconda that includes only conda, Python, the packages they depend on, and a small number of other useful packages, including pip, zlib and a few others. [See if Miniconda is right for you.](https://docs.conda.io/projects/conda/en/latest/user-guide/install/download.html#anaconda-or-miniconda)
    
    === "Windows"
        TODO

    === "Linux"
        If you are running a Linux OS.

        === "Intel"
            ```shell
            curl -LO https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh
            bash Miniconda3-latest-Linux-x86_64.sh -b -p ~/miniconda
            ```

        === "ARM64"
            ```shell
            curl -LO https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-aarch64.sh
            bash Miniconda3-latest-Linux-aarch64.sh -b -p $HOME/miniconda
            ```

    === "MacOS"
        If you are running MacOS.

        === "Intel"
            If you are running on x86/Intel hardware.

            ```shell
            curl -LO https://repo.anaconda.com/miniconda/Miniconda3-latest-MacOSX-x86_64.sh
            bash Miniconda3-latest-MacOSX-x86_64.sh -b -p $HOME/miniconda
            ```

         === "Apple Silicon"
            If you are running on Apple Silicon/ARM hardware.

            ```shell
            curl -LO https://repo.anaconda.com/miniconda/Miniconda3-latest-MacOSX-arm64.sh
            bash Miniconda3-latest-MacOSX-arm64.sh -b -p $HOME/miniconda
            ```

=== "Install Anaconda"
    This will install Miniconda plus hundreds of packages.

    === "MacOS"
        ```shell
        curl -LO https://repo.anaconda.com/archive/Anaconda3-2021.11-MacOSX-x86_64.sh
        bash Anaconda3-2021.11-MacOSX-x86_64.sh -b -p $HOME/miniconda
        ```

    === "Linux"
        === "x86"
            ```shell
            curl -LO https://repo.anaconda.com/archive/Anaconda3-2021.11-Linux-x86_64.sh
            bash Anaconda3-2021.11-Linux-x86_64.sh -b -p $HOME/miniconda
            ```

        === "POWER8 and POWER9"
            ```shell
            curl -LO https://repo.anaconda.com/archive/Anaconda3-2021.11-Linux-ppc64le.sh
            bash Anaconda3-2021.11-Linux-ppc64le.sh -b -p $HOME/miniconda
            ```

        === "AWS Graviton2/ARM64"
            ```shell
            curl -LO https://repo.anaconda.com/archive/Anaconda3-2021.11-Linux-aarch64.sh
            bash Anaconda3-2021.11-Linux-aarch64.sh -b -p $HOME/miniconda
            ```

        === "IBM z/Linux and LinuxONE"
            ```shell
            curl -LO https://repo.anaconda.com/archive/Anaconda3-2021.11-Linux-s390x.sh
            bash Anaconda3-2021.11-Linux-s390x.sh -b -p $HOME/miniconda
            ```

## Update your PATH to include conda

```shell
export PATH=~/miniconda/bin:$PATH
```
