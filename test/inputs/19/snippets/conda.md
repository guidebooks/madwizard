# Conda: Installation

--8<-- "./what-is-conda.md"

## Installation Method

The fastest way to obtain conda is to install Miniconda, a mini
version of Anaconda that includes only conda and its dependencies. If
you prefer to have conda plus over 7,500 open-source packages, install
Anaconda.

=== "Miniconda"
    Miniconda is a free minimal installer for conda. It is a small, bootstrap version of Anaconda that includes only conda, Python, the packages they depend on, and a small number of other useful packages, including pip, zlib and a few others. [See if Miniconda is right for you.](https://docs.conda.io/projects/conda/en/latest/user-guide/install/download.html#anaconda-or-miniconda)
    
    === "Windows"
        ```shell
        echo windowsfake
        ```

    === "MacOS"
        === "Intel"
            If you are running on x86/Intel hardware.

            ```shell
            bash <(curl -L https://repo.anaconda.com/miniconda/Miniconda3-latest-MacOSX-x86_64.sh)
            ```

        === "Apple Silicon"
            If you are running on Apple Silicon/ARM hardware.

            ```shell
            bash <(curl -L https://repo.anaconda.com/miniconda/Miniconda3-latest-MacOSX-arm64.sh)
            ```

    === "Linux"
        ```shell
        echo linuxfake
        ```

=== "Anaconda"
    This will install Miniconda plus hundreds of packages.
    
    === "Windows"
        ```shell
        echo windowsfake
        ```

    === "MacOS"
        ```shell
        bash $<(curl -L https://repo.anaconda.com/archive/Anaconda3-2021.11-MacOSX-x86_64.sh)
        ```

    === "Linux"
        === "x86"
            ```shell
            bash $<(curl -L https://repo.anaconda.com/archive/Anaconda3-2021.11-Linux-x86_64.sh)
            ```

        === "POWER8 and POWER9"
            ```shell
            bash $<(curl -L https://repo.anaconda.com/archive/Anaconda3-2021.11-Linux-ppc64le.sh)
            ```

        === "AWS Graviton2/ARM64"
            ```shell
            bash $<(curl -L https://repo.anaconda.com/archive/Anaconda3-2021.11-Linux-aarch64.sh)
            ```

        === "IBM z/Linux and LinuxONE"
            ```shell
            bash $<(curl -L https://repo.anaconda.com/archive/Anaconda3-2021.11-Linux-s390x.sh)
            ```
